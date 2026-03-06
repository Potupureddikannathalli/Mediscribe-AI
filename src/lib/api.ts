const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const api = {
  async login(credentials: any) {
    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      const data = await response.json();
      if (data.success && data.data) {
        return { ...data.data, id: data.data._id };
      }
      return data; // Return the whole response for error handling
    } catch (error) {
      console.error('Error logging in:', error);
      return { success: false, message: 'Connection error' };
    }
  },

  async getDoctors() {
    try {
      const response = await fetch(`${API_URL}/api/doctors`);
      const data = await response.json();
      return data.success ? data.data.map((d: any) => ({ ...d, id: d._id })) : [];
    } catch (error) {
      console.error('Error fetching doctors:', error);
      return [];
    }
  },

  async getDoctor(id: string) {
    try {
      const response = await fetch(`${API_URL}/api/doctors/${id}`);
      const data = await response.json();
      return data.success ? { ...data.data, id: data.data._id } : null;
    } catch (error) {
      console.error('Error fetching doctor:', error);
      return null;
    }
  },

  async createDoctor(doctor: any) {
    try {
      const response = await fetch(`${API_URL}/api/doctors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doctor),
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to create doctor');
      }
      return { ...data.data, id: data.data._id };
    } catch (error: any) {
      console.error('Error creating doctor:', error);
      throw error;
    }
  },

  async updateDoctor(id: string, updates: any) {
    try {
      const response = await fetch(`${API_URL}/api/doctors/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await response.json();
      return data.success ? { ...data.data, id: data.data._id } : null;
    } catch (error) {
      console.error('Error updating doctor:', error);
      return null;
    }
  },

  async deleteDoctor(id: string) {
    try {
      const response = await fetch(`${API_URL}/api/doctors/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Error deleting doctor:', error);
      return false;
    }
  },

  async getUsers() {
    try {
      const response = await fetch(`${API_URL}/api/users`);
      const data = await response.json();
      return data.success ? data.data.map((u: any) => ({ ...u, id: u._id })) : [];
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  },

  async createUser(user: any) {
    try {
      const response = await fetch(`${API_URL}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to create user');
      }
      return { ...data.data, id: data.data._id };
    } catch (error: any) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  async updateUser(id: string, updates: any) {
    try {
      const response = await fetch(`${API_URL}/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await response.json();
      return data.success ? { ...data.data, id: data.data._id } : null;
    } catch (error) {
      console.error('Error updating user:', error);
      return null;
    }
  },

  async deleteUser(id: string) {
    try {
      const response = await fetch(`${API_URL}/api/users/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  },

  async getAppointments(filters?: { patientId?: string; doctorId?: string }) {
    try {
      const params = new URLSearchParams(filters as any);
      const response = await fetch(`${API_URL}/api/appointments?${params}`);
      const data = await response.json();
      return data.success ? data.data.map((a: any) => ({ ...a, id: a._id })) : [];
    } catch (error) {
      console.error('Error fetching appointments:', error);
      return [];
    }
  },

  async createAppointment(appointment: any) {
    try {
      const response = await fetch(`${API_URL}/api/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointment),
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to create appointment');
      }
      return { ...data.data, id: data.data._id };
    } catch (error: any) {
      console.error('Error creating appointment:', error);
      throw error;
    }
  },

  async updateAppointment(id: string, updates: any) {
    try {
      const response = await fetch(`${API_URL}/api/appointments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await response.json();
      return data.success ? { ...data.data, id: data.data._id } : null;
    } catch (error) {
      console.error('Error updating appointment:', error);
      return null;
    }
  },

  async getConsultations(filters?: { patientId?: string; doctorId?: string; appointmentId?: string }) {
    try {
      const params = new URLSearchParams(filters as any);
      const response = await fetch(`${API_URL}/api/consultations?${params}`);
      const data = await response.json();
      return data.success ? data.data.map((c: any) => ({ ...c, id: c._id })) : [];
    } catch (error) {
      console.error('Error fetching consultations:', error);
      return [];
    }
  },

  async createConsultation(consultation: any) {
    try {
      const response = await fetch(`${API_URL}/api/consultations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(consultation),
      });
      const data = await response.json();
      return data.success ? { ...data.data, id: data.data._id } : null;
    } catch (error) {
      console.error('Error creating consultation:', error);
      return null;
    }
  },

  async uploadFile(file: File) {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      return data.success ? data.data.url : null;
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  },
};
