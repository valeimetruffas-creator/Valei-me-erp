import { useEffect } from 'react';
import { useConfeitariaStore } from '../store/useConfeitariaStore';

export function useSyncInitializer() {
  const inicializarSincronizacao = useConfeitariaStore(state => state.inicializarSincronizacao);

  useEffect(() => {
    // Aguardar um pouco para o store estar totalmente carregado
    const timer = setTimeout(() => {
      inicializarSincronizacao();
    }, 1000);

    return () => clearTimeout(timer);
  }, [inicializarSincronizacao]);
}