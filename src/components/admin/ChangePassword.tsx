import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Lock } from 'lucide-react';

export const ChangePassword = () => {
    const [formData, setFormData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmNewPassword: '',
        twoFactorToken: '',
    });
    const [requires2fa, setRequires2fa] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        if (formData.newPassword !== formData.confirmNewPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match.' });
            return;
        }

        setLoading(true);

        try {
            // Grab your auth token
            let rawToken = sessionStorage.getItem('auth_token') || '';

            // This removes ALL single/double quotes globally and trims accidental spaces
            const token = rawToken.replace(/['"]+/g, '').trim();

            // Pull the base URL from your .env file (fallback to localhost:4000 just in case)
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

            const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData),
            });

            // Safely parse JSON to prevent crashes if the server returns an HTML error page
            let data;
            try {
                data = await response.json();
            } catch (err) {
                throw new Error("Server did not return a valid response. Check your backend connection.");
            }

            if (data.requires2fa) {
                setRequires2fa(true);
                setMessage({ type: 'warning', text: 'Please enter your 2FA token to continue.' });
            } else if (!response.ok) {
                setMessage({ type: 'error', text: data.message || 'Failed to update password.' });
            } else {
                setMessage({ type: 'success', text: 'Password updated successfully!' });
                setFormData({ oldPassword: '', newPassword: '', confirmNewPassword: '', twoFactorToken: '' });
                setRequires2fa(false); // Reset 2FA state on success
            }
        } catch (error: any) {
            console.error('Change password error:', error);
            setMessage({ type: 'error', text: error.message || 'A network error occurred.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
                <Lock className="w-5 h-5 text-gray-600" />
                <h2 className="text-xl font-semibold">Change Password</h2>
            </div>

            <p className="text-sm text-gray-500 mb-6">
                Update your password to keep your account secure.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
                <div>
                    <label className="block text-sm font-medium mb-1">Current Password</label>
                    <input
                        type="password"
                        name="oldPassword"
                        value={formData.oldPassword}
                        onChange={handleChange}
                        required
                        className="w-full p-2 border rounded-md"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">New Password</label>
                    <input
                        type="password"
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleChange}
                        required
                        className="w-full p-2 border rounded-md"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Confirm New Password</label>
                    <input
                        type="password"
                        name="confirmNewPassword"
                        value={formData.confirmNewPassword}
                        onChange={handleChange}
                        required
                        className="w-full p-2 border rounded-md"
                    />
                </div>

                {/* Dynamically show the 2FA field if the backend asks for it */}
                {requires2fa && (
                    <div>
                        <label className="block text-sm font-medium mb-1 text-orange-600">2FA Token Required</label>
                        <input
                            type="text"
                            name="twoFactorToken"
                            value={formData.twoFactorToken}
                            onChange={handleChange}
                            placeholder="Enter 6-digit code"
                            required
                            className="w-full p-2 border border-orange-300 rounded-md focus:ring-orange-500"
                        />
                    </div>
                )}

                {message.text && (
                    <div className={`p-3 rounded-md text-sm ${message.type === 'error' ? 'bg-red-50 text-red-600' :
                            message.type === 'success' ? 'bg-green-50 text-green-600' :
                                'bg-orange-50 text-orange-600'
                        }`}>
                        {message.text}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="bg-slate-900 text-white px-4 py-2 rounded-md hover:bg-slate-800 disabled:opacity-50"
                >
                    {loading ? 'Updating...' : 'Update Password'}
                </button>
            </form>
        </Card>
    );
};