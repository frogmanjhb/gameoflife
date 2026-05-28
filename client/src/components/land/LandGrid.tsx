import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { LandParcel, BiomeType } from '../../types';
import { landApi } from '../../services/api';
import { BIOME_CONFIG, formatCurrency, BIOME_ICONS } from './BiomeConfig';
import { isCommunityAuctionPlot, COMMUNITY_AUCTION_HOVER_TITLE, HIDDEN_AUCTION_PRICE_LABEL } from './communityPlot';
import LandPopup from './LandPopup';
import PurchaseModal from './PurchaseModal';
import TeacherParcelAssignPanel, { ClassStudentOption } from './TeacherParcelAssignPanel';
import { ZoomIn, ZoomOut, Maximize2, Filter, Loader2, RefreshCw } from 'lucide-react';

interface LandGridProps {
  onParcelSelect?: (parcel: LandParcel) => void;
  readOnly?: boolean;
  /** When true (teacher), tiles can be dragged to swap positions to match classroom board */
  canRearrange?: boolean;
  /** When true (teacher), click a plot to assign or remove student ownership */
  canManageOwnership?: boolean;
  townClass: '6A' | '6B' | '6C';
}

const GRID_SIZE = 10;
const MIN_CELL_SIZE = 20;
const MAX_CELL_SIZE = 80;
const DEFAULT_CELL_SIZE = 50;

const LandGrid: React.FC<LandGridProps> = ({
  onParcelSelect,
  readOnly = false,
  canRearrange = false,
  canManageOwnership = false,
  townClass,
}) => {
  const [parcels, setParcels] = useState<LandParcel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [cellSize, setCellSize] = useState(DEFAULT_CELL_SIZE);
  const [hoveredParcel, setHoveredParcel] = useState<LandParcel | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [selectedParcel, setSelectedParcel] = useState<LandParcel | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  
  const [filterBiome, setFilterBiome] = useState<BiomeType | ''>('');
  const [filterOwned, setFilterOwned] = useState<'all' | 'available' | 'owned'>('all');
  const [showFilters, setShowFilters] = useState(false);
  
  const [draggedParcel, setDraggedParcel] = useState<LandParcel | null>(null);
  const [dropTargetKey, setDropTargetKey] = useState<string | null>(null);
  const [swapLoading, setSwapLoading] = useState(false);
  const [recalcLoading, setRecalcLoading] = useState(false);
  const [recalcSuccess, setRecalcSuccess] = useState(false);
  const [manageSelectedParcel, setManageSelectedParcel] = useState<LandParcel | null>(null);
  const [classStudents, setClassStudents] = useState<ClassStudentOption[]>([]);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Fetch all parcels for the selected town
  useEffect(() => {
    fetchParcels();
    if (canManageOwnership) {
      setManageSelectedParcel(null);
    }
  }, [townClass, canManageOwnership]);

  useEffect(() => {
    if (!canManageOwnership) return;
    landApi.getClassStudents(townClass).then((res) => setClassStudents(res.data)).catch(() => setClassStudents([]));
  }, [canManageOwnership, townClass]);

  const fetchParcels = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await landApi.getParcels({ townClass });
      setParcels(response.data);
      if (manageSelectedParcel) {
        const refreshed = response.data.find((p) => p.id === manageSelectedParcel.id);
        setManageSelectedParcel(refreshed ?? null);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load land plots');
    } finally {
      setLoading(false);
    }
  };

  // Create a map for O(1) parcel lookup
  const parcelMap = useMemo(() => {
    const map = new Map<string, LandParcel>();
    parcels.forEach(p => {
      map.set(`${p.row_index}-${p.col_index}`, p);
    });
    return map;
  }, [parcels]);

  // Get parcel at coordinates
  const getParcel = useCallback((row: number, col: number): LandParcel | undefined => {
    return parcelMap.get(`${row}-${col}`);
  }, [parcelMap]);

  // Filter visible cells based on current filters
  const shouldShowCell = useCallback((parcel: LandParcel | undefined): boolean => {
    if (!parcel) return true; // Show empty cells
    
    if (filterBiome && parcel.biome_type !== filterBiome) return false;
    if (filterOwned === 'available' && parcel.owner_id) return false;
    if (filterOwned === 'owned' && !parcel.owner_id) return false;
    
    return true;
  }, [filterBiome, filterOwned]);

  // Handle mouse move for hover popup
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  }, []);

  // Handle cell hover
  const handleCellHover = useCallback((row: number, col: number) => {
    const parcel = getParcel(row, col);
    if (parcel && shouldShowCell(parcel)) {
      setHoveredParcel(parcel);
    } else {
      setHoveredParcel(null);
    }
  }, [getParcel, shouldShowCell]);

  // Handle cell click
  const handleCellClick = useCallback((row: number, col: number) => {
    const parcel = getParcel(row, col);
    if (canManageOwnership && parcel) {
      setManageSelectedParcel(parcel);
    } else if (parcel && !parcel.owner_id && !readOnly && !isCommunityAuctionPlot(parcel)) {
      setSelectedParcel(parcel);
      setShowPurchaseModal(true);
    }
    if (onParcelSelect && parcel) {
      onParcelSelect(parcel);
    }
  }, [getParcel, readOnly, onParcelSelect, canManageOwnership]);

  // Drag-and-drop for teacher: swap two parcels
  const handleCellDragStart = useCallback((e: React.DragEvent, parcel: LandParcel) => {
    if (!canRearrange) return;
    setDraggedParcel(parcel);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/x-parcel-id', String(parcel.id));
    e.dataTransfer.setData('text/plain', parcel.grid_code);
  }, [canRearrange]);

  const handleCellDragEnd = useCallback(() => {
    setDraggedParcel(null);
    setDropTargetKey(null);
  }, []);

  const handleCellDragOver = useCallback((e: React.DragEvent, row: number, col: number) => {
    if (!canRearrange || !draggedParcel) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const target = getParcel(row, col);
    if (target && target.id !== draggedParcel.id) setDropTargetKey(`${row}-${col}`);
  }, [canRearrange, draggedParcel, getParcel]);

  const handleCellDragLeave = useCallback(() => {
    setDropTargetKey(null);
  }, []);

  const handleCellDrop = useCallback(async (e: React.DragEvent, toRow: number, toCol: number) => {
    e.preventDefault();
    setDropTargetKey(null);
    const parcelIdA = e.dataTransfer.getData('application/x-parcel-id');
    if (!parcelIdA || !draggedParcel) {
      setDraggedParcel(null);
      return;
    }
    const targetParcel = getParcel(toRow, toCol);
    if (!targetParcel || targetParcel.id === draggedParcel.id) {
      setDraggedParcel(null);
      return;
    }
    setSwapLoading(true);
    try {
      await landApi.swapParcels(draggedParcel.id, targetParcel.id);
      await fetchParcels();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to swap tiles');
    } finally {
      setSwapLoading(false);
      setDraggedParcel(null);
    }
  }, [canRearrange, draggedParcel, getParcel]);

  const handleRecalculateValues = useCallback(async () => {
    setRecalcLoading(true);
    setError('');
    setRecalcSuccess(false);
    try {
      const res = await landApi.recalculateValues(townClass);
      await fetchParcels();
      setError('');
      setHoveredParcel(null);
      setRecalcSuccess(true);
      setTimeout(() => setRecalcSuccess(false), 4000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to recalculate prices');
    } finally {
      setRecalcLoading(false);
    }
  }, [townClass]);

  // Zoom controls
  const zoomIn = () => setCellSize(prev => Math.min(prev + 2, MAX_CELL_SIZE));
  const zoomOut = () => setCellSize(prev => Math.max(prev - 2, MIN_CELL_SIZE));
  const resetZoom = () => setCellSize(DEFAULT_CELL_SIZE);

  // Get cell style
  const getCellStyle = useCallback((row: number, col: number) => {
    const parcel = getParcel(row, col);
    if (!parcel) return { backgroundColor: '#e5e7eb' }; // Gray for unloaded
    
    if (!shouldShowCell(parcel)) {
      return { backgroundColor: '#f3f4f6', opacity: 0.3 };
    }

    if (isCommunityAuctionPlot(parcel)) {
      const isOwned = !!parcel.owner_id;
      return {
        background: isOwned
          ? 'linear-gradient(135deg, #fcd34d 0%, #f59e0b 100%)'
          : 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
        border: '2px solid #fef3c7',
      };
    }
    
    const config = BIOME_CONFIG[parcel.biome_type];
    const isOwned = !!parcel.owner_id;
    
    return {
      backgroundColor: isOwned ? config.lightColor : config.color,
      border: isOwned ? `1px solid ${config.color}` : 'none',
    };
  }, [getParcel, shouldShowCell]);

  // Render grid cells
  const renderGrid = useMemo(() => {
    const cells = [];
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const parcel = getParcel(row, col);
        const isHovered = hoveredParcel?.row_index === row && hoveredParcel?.col_index === col;
        const isDragging = canRearrange && draggedParcel?.row_index === row && draggedParcel?.col_index === col;
        const isDropTarget = canRearrange && dropTargetKey === `${row}-${col}`;
        
        const isAuctionPlot = parcel ? isCommunityAuctionPlot(parcel) : false;
        const isManageSelected =
          canManageOwnership &&
          manageSelectedParcel &&
          parcel &&
          manageSelectedParcel.id === parcel.id;
        
        cells.push(
          <div
            key={`${row}-${col}`}
            className={`transition-all rounded-sm ${
              canRearrange ? 'cursor-grab active:cursor-grabbing' : canManageOwnership ? 'cursor-pointer' : 'cursor-pointer'
            } ${isAuctionPlot ? 'land-auction-cell' : ''} ${
              isManageSelected ? 'ring-2 ring-emerald-500 ring-offset-1 z-20 scale-105 shadow-lg' :
              isHovered && !isAuctionPlot ? 'ring-2 ring-white z-10 scale-110 shadow-lg' : isHovered ? 'ring-2 ring-amber-200 z-10 scale-110 shadow-lg' : 'hover:brightness-110'
            } ${
              isDragging ? 'opacity-50 scale-95' : ''
            } ${isDropTarget ? 'ring-2 ring-primary-500 ring-offset-1 z-20' : ''}`}
            style={{
              ...getCellStyle(row, col),
              width: `${cellSize}px`,
              height: `${cellSize}px`,
              minWidth: `${cellSize}px`,
              minHeight: `${cellSize}px`,
            }}
            draggable={canRearrange && !!parcel}
            onDragStart={canRearrange && parcel ? (e) => handleCellDragStart(e, parcel) : undefined}
            onDragEnd={canRearrange ? handleCellDragEnd : undefined}
            onDragOver={canRearrange ? (e) => handleCellDragOver(e, row, col) : undefined}
            onDragLeave={canRearrange ? handleCellDragLeave : undefined}
            onDrop={canRearrange ? (e) => handleCellDrop(e, row, col) : undefined}
            onMouseEnter={() => handleCellHover(row, col)}
            onMouseLeave={() => setHoveredParcel(null)}
            onClick={() => handleCellClick(row, col)}
            title={
              parcel
                ? isAuctionPlot
                  ? COMMUNITY_AUCTION_HOVER_TITLE
                  : canRearrange
                    ? `Drag to swap • ${parcel.grid_code}`
                    : parcel.grid_code
                : `Empty ${row}-${col}`
            }
          >
            {isAuctionPlot && cellSize >= 28 && (
              <span className="flex items-center justify-center w-full h-full text-xs font-bold text-amber-950 drop-shadow-sm pointer-events-none">
                🏛️
              </span>
            )}
          </div>
        );
      }
    }
    return cells;
  }, [cellSize, hoveredParcel, draggedParcel, dropTargetKey, canRearrange, canManageOwnership, manageSelectedParcel, getParcel, getCellStyle, handleCellHover, handleCellClick, handleCellDragStart, handleCellDragEnd, handleCellDragOver, handleCellDragLeave, handleCellDrop]);

  // Biome legend
  const biomeTypes = Object.keys(BIOME_CONFIG) as BiomeType[];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-gray-50 rounded-xl">
        <Loader2 className="h-12 w-12 text-primary-600 animate-spin mb-4" />
        <p className="text-gray-600">Loading land plots...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-red-50 rounded-xl">
        <p className="text-red-600 mb-4">{error}</p>
        <button 
          onClick={fetchParcels}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (parcels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-amber-50 rounded-xl border-2 border-amber-200">
        <div className="text-5xl mb-4">🗺️</div>
        <p className="text-amber-800 font-medium mb-2">No land plots found</p>
        <p className="text-sm text-amber-600">Ask your teacher to seed the land data first</p>
        <p className="text-xs text-amber-500 mt-2">(Teacher: Go to Land Registry → click "Seed Land Data")</p>
      </div>
    );
  }

  return (
    <div className="space-y-4" ref={containerRef}>
      {/* Teacher: Recalculate prices so hover prices match legend */}
      {canRearrange && (
        <div className="flex flex-wrap items-center justify-between gap-4 bg-amber-50 border border-amber-200 p-4 rounded-xl">
          <div>
            <p className="text-sm text-amber-800">
              Drag any tile onto another to swap positions and match your classroom board. Use &quot;Recalculate prices&quot; to sync plot values with the legend.
              {canManageOwnership && (
                <> Click a plot below to assign it to a student or remove ownership.</>
              )}
            </p>
            {recalcSuccess && (
              <p className="text-sm text-green-700 font-medium mt-2">Prices updated to match the legend.</p>
            )}
          </div>
          <button
            type="button"
            onClick={handleRecalculateValues}
            disabled={recalcLoading || parcels.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {recalcLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Recalculate prices
          </button>
        </div>
      )}

      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        {/* Zoom Controls */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500 mr-2">Zoom:</span>
          <button 
            onClick={zoomOut}
            className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium w-12 text-center">{cellSize}px</span>
          <button 
            onClick={zoomIn}
            className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button 
            onClick={resetZoom}
            className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            title="Reset Zoom"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
            showFilters ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Filter className="h-4 w-4" />
          <span>Filters</span>
          {(filterBiome || filterOwned !== 'all') && (
            <span className="bg-primary-600 text-white text-xs px-2 py-0.5 rounded-full">
              Active
            </span>
          )}
        </button>

        {/* Stats */}
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span>Total: <strong>{parcels.length.toLocaleString()}</strong></span>
          <span>Available: <strong>{parcels.filter(p => !p.owner_id).length.toLocaleString()}</strong></span>
          <span>Owned: <strong>{parcels.filter(p => p.owner_id).length.toLocaleString()}</strong></span>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">Filter Plots</h4>
            <button 
              onClick={() => {
                setFilterBiome('');
                setFilterOwned('all');
              }}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Clear All
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Biome Filter */}
            <div>
              <label className="block text-sm text-gray-600 mb-2">Biome Type</label>
              <select
                value={filterBiome}
                onChange={(e) => setFilterBiome(e.target.value as BiomeType | '')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All Biomes</option>
                {biomeTypes.map(biome => (
                  <option key={biome} value={biome}>{BIOME_ICONS[biome]} {biome}</option>
                ))}
              </select>
            </div>
            
            {/* Ownership Filter */}
            <div>
              <label className="block text-sm text-gray-600 mb-2">Ownership</label>
              <select
                value={filterOwned}
                onChange={(e) => setFilterOwned(e.target.value as 'all' | 'available' | 'owned')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Plots</option>
                <option value="available">Available Only</option>
                <option value="owned">Owned Only</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Grid Container */}
      <div 
        className="relative bg-gray-200 rounded-xl overflow-auto border-2 border-gray-400 p-4"
        style={{ minHeight: '200px' }}
        onMouseMove={handleMouseMove}
      >
        {/* Grid */}
        <div 
          ref={gridRef}
          className="inline-grid gap-1 bg-gray-300 p-2 rounded-lg"
          style={{
            gridTemplateColumns: `repeat(${GRID_SIZE}, ${cellSize}px)`,
            gridTemplateRows: `repeat(${GRID_SIZE}, ${cellSize}px)`,
          }}
        >
          {renderGrid}
        </div>

        {/* Hover Popup */}
        {hoveredParcel && (
          <LandPopup 
            parcel={hoveredParcel} 
            position={mousePos}
            containerRef={containerRef}
          />
        )}
      </div>

      {canManageOwnership && manageSelectedParcel && (
        <TeacherParcelAssignPanel
          parcel={manageSelectedParcel}
          students={classStudents}
          onUpdated={() => fetchParcels()}
          onClose={() => setManageSelectedParcel(null)}
        />
      )}

      {/* Legend */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Biome Legend</h4>
        <p className="text-xs text-gray-500 mb-2">Each plot in a biome costs the same fixed price. Hover a square to confirm.</p>
        <div className="flex flex-wrap gap-3">
          {biomeTypes.map(biome => {
            const config = BIOME_CONFIG[biome];
            return (
              <div 
                key={biome}
                className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
                onClick={() => setFilterBiome(filterBiome === biome ? '' : biome)}
              >
                <div 
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: config.color }}
                />
                <span className="text-xs text-gray-600">{BIOME_ICONS[biome]} {biome}</span>
                <span className="text-xs text-gray-400">({formatCurrency(config.baseValue)})</span>
              </div>
            );
          })}
        </div>
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center space-x-4 text-xs text-gray-500">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded bg-green-600" />
            <span>Available</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded bg-green-200 border border-green-600" />
            <span>Owned</span>
          </div>
        </div>
      </div>

      {/* Purchase Modal */}
      {showPurchaseModal && selectedParcel && (
        <PurchaseModal
          parcel={selectedParcel}
          onClose={() => {
            setShowPurchaseModal(false);
            setSelectedParcel(null);
          }}
          onSuccess={() => {
            fetchParcels();
          }}
        />
      )}
    </div>
  );
};

export default LandGrid;

