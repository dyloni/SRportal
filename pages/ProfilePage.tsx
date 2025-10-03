import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import Card from '../components/ui/Card';
import { RequestStatus } from '../types';
import Button from '../components/ui/Button';

const DetailItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div>
        <dt className="text-sm font-medium text-brand-text-secondary">{label}</dt>
        <dd className="mt-1 text-lg font-semibold text-brand-text-primary">{value || 'N/A'}</dd>
    </div>
);

const StatCard: React.FC<{ title: string; value: number | string }> = ({ title, value }) => (
    <Card className="text-center">
        <h3 className="text-lg font-semibold text-brand-text-secondary">{title}</h3>
        <p className="text-4xl font-bold mt-2 text-brand-pink">{value}</p>
    </Card>
);

const FormInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => (
    <div>
        <label className="block text-base font-semibold text-brand-text-secondary mb-2">{label}</label>
        <input {...props} className={`block w-full px-4 py-3 text-brand-text-primary bg-gray-50 border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-pink focus:border-brand-pink ${props.className}`} />
    </div>
);

const ProfilePage: React.FC = () => {
    const { user, updateUser } = useAuth();
    const { state } = useData();
    
    const [editData, setEditData] = useState({
        firstName: user?.firstName || '',
        surname: user?.surname || '',
    });
    const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if(user) {
            setEditData({ firstName: user.firstName, surname: user.surname });
            setProfilePicPreview(user.profilePictureUrl || null);
        }
    }, [user]);

    if (!user) return null;
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setProfilePicPreview(event.target?.result as string);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };
    
    const handleSaveChanges = (e: React.FormEvent) => {
        e.preventDefault();
        updateUser({
            firstName: editData.firstName,
            surname: editData.surname,
            profilePictureUrl: profilePicPreview || undefined,
        });
        alert('Profile updated successfully!');
    };

    const agentStats = user.type === 'agent' ? {
        customerCount: state.customers.filter(c => c.assignedAgentId === user.id).length,
        pendingRequests: state.requests.filter(r => r.agentId === user.id && r.status === RequestStatus.PENDING).length
    } : null;

    const adminStats = user.type === 'admin' ? {
        totalCustomers: state.customers.length,
        totalAgents: state.agents.length,
        totalPendingRequests: state.requests.filter(r => r.status === RequestStatus.PENDING).length
    } : null;

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-extrabold text-brand-text-primary">My Profile</h2>
            <Card>
                <dl className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-8">
                    <DetailItem label="Full Name" value={`${user.firstName} ${user.surname}`} />
                    <DetailItem label="Email Address" value={user.email} />
                    <DetailItem label="User ID" value={user.id} />
                    <DetailItem label="User Type" value={user.type.charAt(0).toUpperCase() + user.type.slice(1)} />
                    {user.role && <DetailItem label="Role" value={user.role} />}
                </dl>
            </Card>

            <form onSubmit={handleSaveChanges}>
                <Card title="Profile Settings">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-1 flex flex-col items-center">
                            <img 
                                src={profilePicPreview || `https://ui-avatars.com/api/?name=${user.firstName}+${user.surname}&background=d63384&color=fff&size=128`}
                                alt="Profile"
                                className="h-32 w-32 rounded-full object-cover mb-4"
                            />
                            <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()}>
                                Upload new picture
                            </Button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                accept="image/*"
                            />
                        </div>
                        <div className="md:col-span-2 space-y-6">
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <FormInput 
                                    label="First Name" 
                                    value={editData.firstName}
                                    onChange={e => setEditData({...editData, firstName: e.target.value})}
                                />
                                <FormInput 
                                    label="Surname" 
                                    value={editData.surname}
                                    onChange={e => setEditData({...editData, surname: e.target.value})}
                                />
                            </div>
                             <div>
                                <h4 className="text-xl font-bold text-brand-text-primary mb-4 border-t pt-6">Change Password</h4>
                                <div className="space-y-4">
                                    <FormInput label="Current Password" type="password" placeholder="••••••••" />
                                    <FormInput label="New Password" type="password" placeholder="••••••••" />
                                    <FormInput label="Confirm New Password" type="password" placeholder="••••••••" />
                                </div>
                             </div>
                             <div className="flex justify-end pt-4">
                                <Button type="submit">Save Changes</Button>
                             </div>
                        </div>
                    </div>
                </Card>
            </form>

            {user.type === 'agent' && agentStats && (
                <div>
                    <h3 className="text-2xl font-bold text-brand-text-primary mb-4">My Statistics</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                       <StatCard title="My Customers" value={agentStats.customerCount} />
                       <StatCard title="Pending Requests" value={agentStats.pendingRequests} />
                    </div>
                </div>
            )}

            {user.type === 'admin' && adminStats && (
                 <div>
                    <h3 className="text-2xl font-bold text-brand-text-primary mb-4">System Overview</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                       <StatCard title="Total Customers" value={adminStats.totalCustomers} />
                       <StatCard title="Total Agents" value={adminStats.totalAgents} />
                       <StatCard title="Pending Requests" value={adminStats.totalPendingRequests} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;