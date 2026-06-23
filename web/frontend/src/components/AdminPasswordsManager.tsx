import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';

interface AdminPassword {
  id: string;
  password: string;
  description: string;
  level: 'admin' | 'superadmin';
  createdAt: string;
}

interface AdminPasswordsManagerProps {
  serverImageId: string;
}

export function AdminPasswordsManager({ serverImageId }: AdminPasswordsManagerProps) {
  const [passwords, setPasswords] = useState<AdminPassword[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPassword, setNewPassword] = useState({
    password: '',
    description: '',
    level: 'admin' as 'admin' | 'superadmin'
  });

  useEffect(() => {
    fetchPasswords();
  }, [serverImageId]);

  const fetchPasswords = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/server-images/${serverImageId}/admin-passwords`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPasswords(data.passwords);
      }
    } catch (error) {
      console.error('Error fetching admin passwords:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPassword = async () => {
    if (!newPassword.password || !newPassword.description) {
      alert('Contraseña y descripción son requeridas');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/server-images/${serverImageId}/admin-passwords`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newPassword)
      });

      if (response.ok) {
        setNewPassword({ password: '', description: '', level: 'admin' });
        fetchPasswords();
      } else {
        alert('Error al crear contraseña');
      }
    } catch (error) {
      console.error('Error creating admin password:', error);
      alert('Error al crear contraseña');
    }
  };

  const deletePassword = async (passwordId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta contraseña?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin-passwords/${passwordId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchPasswords();
      } else {
        alert('Error al eliminar contraseña');
      }
    } catch (error) {
      console.error('Error deleting admin password:', error);
      alert('Error al eliminar contraseña');
    }
  };

  if (loading) {
    return <div className="p-4">Cargando contraseñas de admin...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Contraseñas de Administrador</h3>
      
      {/* Crear nueva contraseña */}
      <Card className="p-4">
        <h4 className="font-medium mb-3">Agregar Nueva Contraseña</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="text"
              value={newPassword.password}
              onChange={(e) => setNewPassword(prev => ({ ...prev, password: e.target.value }))}
              placeholder="admin123"
            />
          </div>
          <div>
            <Label htmlFor="description">Descripción</Label>
            <Input
              id="description"
              type="text"
              value={newPassword.description}
              onChange={(e) => setNewPassword(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Admin principal"
            />
          </div>
          <div>
            <Label htmlFor="level">Nivel</Label>
            <select
              id="level"
              value={newPassword.level}
              onChange={(e) => setNewPassword(prev => ({ ...prev, level: e.target.value as 'admin' | 'superadmin' }))}
              className="w-full p-2 border rounded"
            >
              <option value="admin">Admin</option>
              <option value="superadmin">Super Admin</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={createPassword}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Agregar
            </button>
          </div>
        </div>
      </Card>

      {/* Lista de contraseñas existentes */}
      <div className="space-y-2">
        {passwords.length === 0 ? (
          <Card className="p-4 text-center text-gray-500">
            No hay contraseñas de admin configuradas
          </Card>
        ) : (
          passwords.map((pwd) => (
            <Card key={pwd.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                      {pwd.password}
                    </code>
                    <Badge variant={pwd.level === 'superadmin' ? 'destructive' : 'secondary'}>
                      {pwd.level === 'superadmin' ? 'Super Admin' : 'Admin'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{pwd.description}</p>
                  <p className="text-xs text-gray-400">
                    Creada: {new Date(pwd.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => deletePassword(pwd.id)}
                  className="text-red-500 hover:text-red-700 px-3 py-1 text-sm"
                >
                  Eliminar
                </button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}