'use client';

import React, { useState } from 'react';
import {
  UserGroupIcon,
  PlusIcon,
  PhoneIcon,
  EnvelopeIcon,
  PencilIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { Card, CardHeader, CardContent, CardTitle } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useAuth } from '../../../components/providers/AuthProvider';
import toast from 'react-hot-toast';

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  email: string;
  relationship: string;
  priority: number;
}

export default function ContactsPage() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<EmergencyContact[]>(user?.emergencyContacts || []);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    relationship: '',
    priority: 1,
  });

  const relationshipOptions = [
    'Spouse/Partner', 'Parent', 'Child', 'Sibling', 'Friend',
    'Colleague', 'Neighbor', 'Doctor', 'Emergency Service', 'Other'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.phone) {
      toast.error('Name and phone number are required');
      return;
    }

    if (editingId) {
      // Update existing contact
      setContacts(contacts.map(contact =>
        contact.id === editingId
          ? { ...contact, ...formData }
          : contact
      ));
      toast.success('Contact updated successfully');
    } else {
      // Add new contact
      const newContact: EmergencyContact = {
        id: Math.random().toString(36).substr(2, 9),
        ...formData,
      };
      setContacts([...contacts, newContact]);
      toast.success('Emergency contact added successfully');
    }

    // Reset form
    setFormData({
      name: '',
      phone: '',
      email: '',
      relationship: '',
      priority: contacts.length + 1,
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEdit = (contact: EmergencyContact) => {
    setFormData({
      name: contact.name,
      phone: contact.phone,
      email: contact.email,
      relationship: contact.relationship,
      priority: contact.priority,
    });
    setEditingId(contact.id);
    setIsAdding(true);
  };

  const handleDelete = (id: string) => {
    const contact = contacts.find(c => c.id === id);
    if (contact && window.confirm(`Are you sure you want to remove ${contact.name} from your emergency contacts?`)) {
      setContacts(contacts.filter(c => c.id !== id));
      toast.success('Contact removed successfully');
    }
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      relationship: '',
      priority: contacts.length + 1,
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const testContact = (contact: EmergencyContact) => {
    toast.success(`Test alert sent to ${contact.name}`);
  };

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  const getPriorityColor = (priority: number) => {
    if (priority === 0) return 'danger'; // Emergency services
    if (priority <= 2) return 'warning'; // High priority
    if (priority <= 4) return 'info'; // Medium priority
    return 'default'; // Low priority
  };

  const sortedContacts = [...contacts].sort((a, b) => a.priority - b.priority);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Emergency Contacts</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your emergency contact list. These people will be notified during emergencies.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          {!isAdding && (
            <Button onClick={() => setIsAdding(true)}>
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Contact
            </Button>
          )}
        </div>
      </div>

      {/* Add/Edit Form */}
      {isAdding && (
        <Card className="border-rose-200">
          <CardHeader>
            <CardTitle>
              {editingId ? 'Edit Emergency Contact' : 'Add New Emergency Contact'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Full Name *"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter full name"
                  required
                />

                <Input
                  label="Phone Number *"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                  required
                />

                <Input
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Relationship
                  </label>
                  <select
                    value={formData.relationship}
                    onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                    className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  >
                    <option value="">Select relationship</option>
                    {relationshipOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority Level
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                  className="w-full md:w-48 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                >
                  <option value={0}>0 - Emergency Services (Highest)</option>
                  <option value={1}>1 - Primary Contact</option>
                  <option value={2}>2 - Secondary Contact</option>
                  <option value={3}>3 - Tertiary Contact</option>
                  <option value={4}>4 - Backup Contact</option>
                  <option value={5}>5 - Low Priority</option>
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  Lower numbers = higher priority. Emergency services are typically priority 0.
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingId ? 'Update Contact' : 'Add Contact'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Emergency Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ExclamationTriangleIcon className="w-5 h-5 mr-2 text-amber-600" />
            Emergency Contact Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Best Practices:</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  Include at least 3-5 emergency contacts
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  Mix of family members and close friends
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  Verify phone numbers are current and active
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  Inform contacts they're on your emergency list
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Priority Levels:</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <Badge variant="danger" className="mr-2 mt-0.5">0</Badge>
                  Emergency Services (100, Police, Fire)
                </li>
                <li className="flex items-start">
                  <Badge variant="warning" className="mr-2 mt-0.5">1-2</Badge>
                  Primary contacts (Spouse, Parents)
                </li>
                <li className="flex items-start">
                  <Badge variant="info" className="mr-2 mt-0.5">3-4</Badge>
                  Secondary contacts (Siblings, Close friends)
                </li>
                <li className="flex items-start">
                  <Badge variant="default" className="mr-2 mt-0.5">5+</Badge>
                  Backup contacts (Colleagues, Neighbors)
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contacts List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Emergency Contacts ({contacts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {contacts.length === 0 ? (
            <div className="text-center py-12">
              <UserGroupIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No emergency contacts</h3>
              <p className="text-gray-500 mb-4">
                Add emergency contacts to ensure help can reach you when needed
              </p>
              <Button onClick={() => setIsAdding(true)}>
                <PlusIcon className="w-4 h-4 mr-2" />
                Add First Contact
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedContacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center">
                      <span className="text-lg font-semibold text-rose-600">
                        {contact.name.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900">{contact.name}</h3>
                        <Badge variant={getPriorityColor(contact.priority) as any}>
                          Priority {contact.priority}
                        </Badge>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 text-sm text-gray-500">
                        <div className="flex items-center">
                          <PhoneIcon className="w-4 h-4 mr-1" />
                          {formatPhoneNumber(contact.phone)}
                        </div>
                        {contact.email && (
                          <div className="flex items-center">
                            <EnvelopeIcon className="w-4 h-4 mr-1" />
                            {contact.email}
                          </div>
                        )}
                        {contact.relationship && (
                          <div>
                            <span className="font-medium">{contact.relationship}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testContact(contact)}
                    >
                      Test
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(contact)}
                    >
                      <PencilIcon className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(contact.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
