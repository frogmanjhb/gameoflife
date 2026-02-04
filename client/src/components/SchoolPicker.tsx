import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Search, School } from 'lucide-react';

interface School {
  id: number;
  name: string;
  code: string;
}

interface SchoolPickerProps {
  value: number | null;
  onChange: (schoolId: number) => void;
  required?: boolean;
  error?: string;
  showOptional?: boolean;
}

const SchoolPicker: React.FC<SchoolPickerProps> = ({ value, onChange, required = true, error, showOptional }) => {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const response = await api.get('/auth/schools');
        setSchools(response.data);
      } catch (error) {
        console.error('Failed to fetch schools:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSchools();
  }, []);

  const filteredSchools = schools.filter(school =>
    school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedSchool = schools.find(s => s.id === value);

  return (
    <div className="relative">
      <label className="label">
        <School className="h-4 w-4 inline mr-1" />
        School
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`input-field w-full text-left flex items-center justify-between ${
            error ? 'border-red-500' : ''
          }`}
        >
          <span className={selectedSchool ? 'text-gray-900' : 'text-gray-500'}>
            {selectedSchool ? selectedSchool.name : 'Select your school...'}
          </span>
          <svg
            className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading schools...</div>
            ) : (
              <>
                <div className="p-2 border-b border-gray-200 sticky top-0 bg-white">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search schools..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
                <div className="py-1">
                  {filteredSchools.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">No schools found</div>
                  ) : (
                    filteredSchools.map((school) => (
                      <button
                        key={school.id}
                        type="button"
                        onClick={() => {
                          onChange(school.id);
                          setIsOpen(false);
                          setSearchTerm('');
                        }}
                        className={`w-full text-left px-4 py-2 hover:bg-primary-50 ${
                          value === school.id ? 'bg-primary-100 font-medium' : ''
                        }`}
                      >
                        <div className="font-medium text-gray-900">{school.name}</div>
                        <div className="text-sm text-gray-500">{school.code}</div>
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {required && !value && (
        <p className="mt-1 text-xs text-gray-500">Please select your school</p>
      )}
    </div>
  );
};

export default SchoolPicker;
