import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DateTime } from 'luxon';

interface CustomerFormData {
  name: string;
  phone: string;
  email: string;
  date: string;
  time: string;
  venue: string;
  persons: string;
}

// Utility function to format date as dd-MMM-yyyy using luxon
function formatDate(dateString: string) {
  if (!dateString) return '';
  const date = DateTime.fromISO(dateString);
  if (!date.isValid) return dateString;
  return date.toFormat('dd-MMM-yyyy');
}

const CustomerDetails: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<CustomerFormData>({
    name: '',
    phone: '',
    email: '',
    date: '',
    time: '',
    venue: '',
    persons: '',
  });
  const [errors, setErrors] = useState<Partial<CustomerFormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<CustomerFormData> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = 'Phone number must be 10 digits';
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    if (!formData.time) {
      newErrors.time = 'Event time is required';
    }
    
    if (!formData.venue.trim()) {
      newErrors.venue = 'Venue is required';
    }
    
    if (!formData.persons) {
      newErrors.persons = 'Number of persons is required';
    } else if (parseInt(formData.persons) <= 0) {
      newErrors.persons = 'Number of persons must be positive';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Store form data in localStorage for persistence
      localStorage.setItem('customerDetails', JSON.stringify(formData));
      navigate('/menu');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="customer-details">
      <h2>Customer Details</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Customer Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            className="form-control"
            value={formData.name}
            onChange={handleChange}
          />
          {errors.name && <span className="error">{errors.name}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="phone">Phone Number *</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            className="form-control"
            value={formData.phone}
            onChange={handleChange}
          />
          {errors.phone && <span className="error">{errors.phone}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input
            type="email"
            id="email"
            name="email"
            className="form-control"
            value={formData.email}
            onChange={handleChange}
          />
          {errors.email && <span className="error">{errors.email}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="date">Catering Date *</label>
          <input
            type="date"
            id="date"
            name="date"
            className="form-control"
            value={formData.date}
            onChange={handleChange}
          />
          {errors.date && <span className="error">{errors.date}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="time">Event Time *</label>
          <input
            type="time"
            id="time"
            name="time"
            className="form-control"
            value={formData.time}
            onChange={handleChange}
          />
          {errors.time && <span className="error">{errors.time}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="venue">Venue *</label>
          <input
            type="text"
            id="venue"
            name="venue"
            className="form-control"
            value={formData.venue}
            onChange={handleChange}
          />
          {errors.venue && <span className="error">{errors.venue}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="persons">Number of Persons *</label>
          <input
            type="number"
            id="persons"
            name="persons"
            className="form-control"
            value={formData.persons}
            onChange={handleChange}
            min="1"
          />
          {errors.persons && <span className="error">{errors.persons}</span>}
        </div>

        <button type="submit" className="btn btn-primary">Next</button>
      </form>
    </div>
  );
};

export default CustomerDetails; 