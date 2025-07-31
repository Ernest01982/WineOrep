import React, { useState, useEffect } from 'react';
import { Clock, MapPin, FileText, CheckCircle } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { OfflineService } from '../services/offline';
import { DatabaseService } from '../services/database';
import { Visit, Client } from '../types';

export function VisitLogger() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeVisit, setActiveVisit] = useState<Visit | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [notes, setNotes] = useState('');
  const [visitType, setVisitType] = useState<'good' | 'missed' | 'problem' | 'bad'>('good');
  const [currentRep, setCurrentRep] = useState<any>(null);

  useEffect(() => {
    loadCurrentRep();
    loadClients();
    
    // Check if client was pre-selected from navigation
    if (location.state?.selectedClient) {
      setSelectedClientId(location.state.selectedClient.id);
    }
  }, []);

  const loadCurrentRep = async () => {
    try {
      const rep = await DatabaseService.getCurrentRep();
      setCurrentRep(rep);
    } catch (error) {
      console.error('Failed to load current rep:', error);
    }
  };

  const loadClients = async () => {
    try {
      let clientList;
      try {
        clientList = await DatabaseService.getClients();
        await OfflineService.saveClients(clientList);
      } catch (error) {
        clientList = await OfflineService.getClients();
      }
      setClients(clientList);
    } catch (error) {
      console.error('Failed to load clients:', error);
    }
  };

  const startVisit = async () => {
    if (!selectedClientId) return;

    const repId = currentRep?.id || 'demo-rep-id';
    const visit: Visit = {
      id: crypto.randomUUID(),
      rep_id: repId,
      client_id: selectedClientId,
      visit_date: new Date().toISOString().split('T')[0],
      check_in_time: new Date().toISOString(),
      sync_status: 'pending',
      created_at: new Date().toISOString()
    };

    try {
      await OfflineService.saveVisit(visit);
      setActiveVisit(visit);
    } catch (error) {
      console.error('Failed to start visit:', error);
      alert('Failed to start visit. Please try again.');
    }
  };

  const endVisit = async () => {
    if (!activeVisit) return;

    const updatedVisit: Visit = {
      ...activeVisit,
      check_out_time: new Date().toISOString(),
      visit_type: visitType,
      notes: notes.trim() || undefined,
      sync_status: 'pending'
    };

    try {
      await OfflineService.saveVisit(updatedVisit);
      setActiveVisit(null);
      setSelectedClientId('');
      setNotes('');
      setVisitType('good');
      alert('Visit logged successfully!');
      navigate('/');
    } catch (error) {
      console.error('Failed to end visit:', error);
      alert('Failed to end visit. Please try again.');
    }
  };

  const getVisitDuration = () => {
    if (!activeVisit) return '';
    
    const start = new Date(activeVisit.check_in_time);
    const now = new Date();
    const duration = Math.floor((now.getTime() - start.getTime()) / 1000 / 60);
    
    return `${duration} minutes`;
  };

  const selectedClient = clients.find(c => c.id === selectedClientId);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Visit Logger</h2>

      {!activeVisit ? (
        /* Start Visit Form */
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4">Start New Visit</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Client
              </label>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Choose a client...</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name} - {client.region}
                  </option>
                ))}
              </select>
            </div>

            {selectedClient && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center text-sm text-gray-600 mb-1">
                  <MapPin size={14} className="mr-1" />
                  {selectedClient.location || 'No location specified'}
                </div>
                {selectedClient.contact_name && (
                  <p className="text-sm text-gray-600">
                    Contact: {selectedClient.contact_name}
                  </p>
                )}
              </div>
            )}

            <button
              onClick={startVisit}
              disabled={!selectedClientId}
              className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Start Visit
            </button>
          </div>
        </div>
      ) : (
        /* Active Visit */
        <div className="space-y-4">
          {/* Visit Status */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800">Visit in Progress</span>
              </div>
              <div className="flex items-center text-sm text-green-700">
                <Clock size={14} className="mr-1" />
                {getVisitDuration()}
              </div>
            </div>
            
            {selectedClient && (
              <div className="mt-2">
                <p className="font-medium text-green-900">{selectedClient.name}</p>
                <p className="text-sm text-green-700">{selectedClient.location || 'No location specified'}</p>
              </div>
            )}
          </div>

          {/* End Visit Form */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">End Visit</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Visit Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'good', label: 'Good', color: 'bg-green-100 text-green-800 border-green-200' },
                    { value: 'missed', label: 'Missed', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
                    { value: 'problem', label: 'Problem', color: 'bg-orange-100 text-orange-800 border-orange-200' },
                    { value: 'bad', label: 'Bad', color: 'bg-red-100 text-red-800 border-red-200' }
                  ].map(type => (
                    <button
                      key={type.value}
                      onClick={() => setVisitType(type.value as any)}
                      className={`p-3 text-sm font-medium rounded-lg border-2 transition-colors ${
                        visitType === type.value
                          ? type.color
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about this visit..."
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <button
                onClick={endVisit}
                className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                End Visit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}