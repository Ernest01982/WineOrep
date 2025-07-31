import React, { useState, useEffect } from 'react';
import { Search, MapPin, Phone, User, Plus } from 'lucide-react';
import { OfflineService } from '../services/offline';
import { Client } from '../types';

export function ClientDirectory() {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    filterClients();
  }, [clients, searchTerm, selectedRegion]);

  const loadClients = async () => {
    try {
      const clientList = await OfflineService.getClients();
      setClients(clientList);
    } catch (error) {
      console.error('Failed to load clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterClients = () => {
    let filtered = clients;

    if (searchTerm) {
      filtered = filtered.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.contact_person?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedRegion) {
      filtered = filtered.filter(client => client.region === selectedRegion);
    }

    setFilteredClients(filtered);
  };

  const regions = [...new Set(clients.map(client => client.region))];

  const handleStartVisit = (client: Client) => {
    // Navigate to visit logger with pre-selected client
    console.log('Starting visit for:', client.name);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Clients</h2>
        <button className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus size={20} />
        </button>
      </div>

      {/* Search and Filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <select
          value={selectedRegion}
          onChange={(e) => setSelectedRegion(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Regions</option>
          {regions.map(region => (
            <option key={region} value={region}>{region}</option>
          ))}
        </select>
      </div>

      {/* Client List */}
      <div className="space-y-3">
        {filteredClients.map((client) => (
          <div key={client.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{client.name}</h3>
                
                {client.contact_person && (
                  <div className="flex items-center mt-1 text-sm text-gray-600">
                    <User size={14} className="mr-1" />
                    {client.contact_person}
                  </div>
                )}
                
                <div className="flex items-center mt-1 text-sm text-gray-600">
                  <MapPin size={14} className="mr-1" />
                  {client.address}
                </div>
                
                {client.phone && (
                  <div className="flex items-center mt-1 text-sm text-gray-600">
                    <Phone size={14} className="mr-1" />
                    {client.phone}
                  </div>
                )}
                
                <span className="inline-block mt-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                  {client.region}
                </span>
              </div>
              
              <button
                onClick={() => handleStartVisit(client)}
                className="ml-4 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
              >
                Start Visit
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredClients.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No clients found</p>
        </div>
      )}
    </div>
  );
}