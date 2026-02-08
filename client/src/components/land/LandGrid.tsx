import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { LandParcel, BiomeType } from '../../types';
import { landApi } from '../../services/api';
import { BIOME_CONFIG, formatCurrency, BIOME_ICONS } from './BiomeConfig';
import LandPopup from './LandPopup';
import PurchaseModal from './PurchaseModal';
import { ZoomIn, ZoomOut, Maximize2, Filter, Loader2 } from 'lucide-react';

interface LandGridProps {
  onParcelSelect?: (parcel: LandParcel) => void;
  readOnly?: boolean;
}

const GRID_SIZE = 10;
const MIN_CELL_SIZE = 20;
const MAX_CELL_SIZE = 80;
const DEFAULT_CELL_SIZE = 50;

const LandGrid: React.FC<LandGridProps> = ({ onParcelSelect, readOnly = false }) => {
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
  
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Fetch all parcels
  useEffect(() => {
    fetchParcels();
  }, []);

  const fetchParcels = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await landApi.getParcels();
      setParcels(response.data);
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
    if (parcel && !parcel.owner_id && !readOnly) {
      setSelectedParcel(parcel);
      setShowPurchaseModal(true);
    }
    if (onParcelSelect && parcel) {
      onParcelSelect(parcel);
    }
  }, [getParcel, readOnly, onParcelSelect]);

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
        
        cells.push(
          <div
            key={`${row}-${col}`}
            className={`transition-all cursor-pointer rounded-sm ${isHovered ? 'ring-2 ring-white z-10 scale-110 shadow-lg' : 'hover:brightness-110'}`}
            style={{
              ...getCellStyle(row, col),
              width: `${cellSize}px`,
              height: `${cellSize}px`,
              minWidth: `${cellSize}px`,
              minHeight: `${cellSize}px`,
            }}
            onMouseEnter={() => handleCellHover(row, col)}
            onMouseLeave={() => setHoveredParcel(null)}
            onClick={() => handleCellClick(row, col)}
            title={parcel?.grid_code || `Empty ${row}-${col}`}
          />
        );
      }
    }
    return cells;
  }, [cellSize, hoveredParcel, getParcel, getCellStyle, handleCellHover, handleCellClick]);

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

      {/* Legend */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Biome Legend</h4>
        <p className="text-xs text-gray-500 mb-2">Plot prices vary ±20% within each biome range. Hover a square to see its exact price.</p>
        <div className="flex flex-wrap gap-3">
          {biomeTypes.map(biome => {
            const config = BIOME_CONFIG[biome];
            const minPrice = Math.round(config.baseValue * 0.8);
            const maxPrice = Math.round(config.baseValue * 1.2);
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
                <span className="text-xs text-gray-400">({formatCurrency(minPrice)} – {formatCurrency(maxPrice)})</span>
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

