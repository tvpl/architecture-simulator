import { useState, useEffect } from 'react';
import { checkApiHealth, ApiInfo } from '@/lib/apiService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

interface ApiStatusProps {
  onClose?: () => void;
}

export function ApiStatus({ onClose }: ApiStatusProps) {
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [apiInfo, setApiInfo] = useState<ApiInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkStatus = async () => {
    setIsChecking(true);
    try {
      const result = await checkApiHealth();
      setIsHealthy(result.isHealthy);
      setApiInfo(result.apiInfo || null);
      setError(result.error || null);
    } catch (err) {
      setIsHealthy(false);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setApiInfo(null);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Status da API</CardTitle>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          )}
        </div>
        <CardDescription>
          Conectividade com o backend .NET Core
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Conexão:</span>
          <div className="flex items-center gap-2">
            {isHealthy === null ? (
              <Badge variant="secondary">Verificando...</Badge>
            ) : isHealthy ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <Badge variant="default" className="bg-green-500">Conectado</Badge>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 text-red-500" />
                <Badge variant="destructive">Desconectado</Badge>
              </>
            )}
          </div>
        </div>

        {apiInfo && (
          <div className="space-y-2">
            <div className="text-sm">
              <span className="font-medium">API:</span> {apiInfo.name}
            </div>
            <div className="text-sm">
              <span className="font-medium">Versão:</span> {apiInfo.version}
            </div>
            <div className="text-sm">
              <span className="font-medium">Tipos de Nó:</span> {apiInfo.supportedNodeTypes.length}
            </div>
            <div className="text-sm">
              <span className="font-medium">Protocolos:</span> {apiInfo.supportedProtocols.join(', ')}
            </div>
          </div>
        )}

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
            <span className="font-medium">Erro:</span> {error}
          </div>
        )}

        <Button 
          onClick={checkStatus} 
          disabled={isChecking}
          variant="outline" 
          size="sm" 
          className="w-full"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
          {isChecking ? 'Verificando...' : 'Verificar Novamente'}
        </Button>

        {!isHealthy && (
          <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
            <p className="font-medium mb-1">Para resolver:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Verifique se a API .NET Core está rodando</li>
              <li>Confirme se a URL da API está correta</li>
              <li>Verifique as configurações de CORS</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

