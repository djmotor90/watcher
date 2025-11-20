import React, { useState } from 'react';
import axios from 'axios';
import { X } from 'lucide-react';

const API_BASE = 'http://localhost:3000/api';

interface AddAgentModalProps {
  onClose: () => void;
  onAgentAdded: () => void;
}

function AddAgentModal({ onClose, onAgentAdded }: AddAgentModalProps) {
  const [agentName, setAgentName] = useState('');
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE}/agents/register`, {
        name: agentName,
        userId,
      });
      setResult(response.data);
      setAgentName('');
      setUserId('');
      
      setTimeout(() => {
        onAgentAdded();
        onClose();
      }, 2000);
    } catch (error: any) {
      setResult({ error: error.response?.data?.error || 'Failed to register agent' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Register New Agent</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {result ? (
          <div className={`modal-result ${result.error ? 'error' : 'success'}`}>
            {result.error ? (
              <>
                <p className="error-text">{result.error}</p>
              </>
            ) : (
              <>
                <p className="success-text">Agent registered successfully!</p>
                <div className="credentials">
                  <div className="credential-item">
                    <label>Agent ID:</label>
                    <code>{result.id}</code>
                  </div>
                  <div className="credential-item">
                    <label>API Key:</label>
                    <code>{result.apiKey}</code>
                  </div>
                  <div className="credential-item">
                    <label>Secret:</label>
                    <code>{result.secret}</code>
                  </div>
                  <p className="warning">Save these credentials securely!</p>
                </div>
              </>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="modal-form">
            <div className="form-group">
              <label>Agent Name</label>
              <input
                type="text"
                value={agentName}
                onChange={e => setAgentName(e.target.value)}
                placeholder="e.g., Production Server 1"
                required
              />
            </div>

            <div className="form-group">
              <label>User ID</label>
              <input
                type="text"
                value={userId}
                onChange={e => setUserId(e.target.value)}
                placeholder="Your user ID"
                required
              />
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Registering...' : 'Register Agent'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default AddAgentModal;
