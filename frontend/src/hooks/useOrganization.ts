import { useState, useEffect } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import OrganizationService from '../services/organizationService';

interface OrganizationData {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  alias?: string;
  plan?: string;
  is_active?: boolean;
}

export const useOrganization = () => {
  const { user, is_authenticated } = useAuthContext();
  const [organization, setOrganization] = useState<OrganizationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (is_authenticated && user) {
      fetchOrganization();
    }
  }, [is_authenticated, user]);

  const fetchOrganization = async () => {
    if (!is_authenticated) {
      setError('Usuario no autenticado');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await OrganizationService.getOrganization();
      
      if (response.data && typeof response.data === 'object') {
        const responseData = response.data as any;
        console.log('Organization data received:', responseData);
        
        if (responseData.organization) {
          const orgData = responseData.organization;
          setOrganization({
            id: orgData._id || orgData.id,
            name: orgData.name,
            description: orgData.description,
            logo: orgData.logo,
            alias: orgData.alias,
            plan: orgData.plan,
            is_active: orgData.is_active,
          });
        } else {
          setError('No se encontró información de la organización');
        }
      } else {
        setError('Respuesta inválida del servidor');
      }
    } catch (err) {
      console.error('Error fetching organization:', err);
      setError('Error al cargar la organización');
    } finally {
      setLoading(false);
    }
  };

  return {
    organization,
    organizationId: organization?.id || null,
    loading,
    error,
    refetch: fetchOrganization
  };
};