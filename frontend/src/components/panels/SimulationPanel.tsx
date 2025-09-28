import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { X, Activity, BarChart3, DollarSign, AlertTriangle } from 'lucide-react';
import { SimulationResultsDisplay } from '../SimulationResultsDisplay';

interface SimulationPanelProps {
  isVisible: boolean;
  onClose: () => void;
  simulationResults: any;
  isSimulating: boolean;
}

export const SimulationPanel: React.FC<SimulationPanelProps> = ({
  isVisible,
  onClose,
  simulationResults,
  isSimulating
}) => {
  if (!isVisible) return null;

  return (
    <Card className="w-full max-w-4xl border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Resultados da Simulação
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="p-6">
        {isSimulating ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Executando simulação...</p>
            </div>
          </div>
        ) : simulationResults ? (
          <div className="space-y-6">
            {/* Métricas principais */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Latência Total</p>
                      <p className="text-2xl font-bold">{simulationResults.totalLatency}ms</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Mensagens</p>
                      <p className="text-2xl font-bold">{simulationResults.totalMessages}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-yellow-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Custo Total</p>
                      <p className="text-2xl font-bold">${simulationResults.totalCost}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Gargalos */}
            {simulationResults.bottlenecks && simulationResults.bottlenecks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    Gargalos Identificados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {simulationResults.bottlenecks.map((bottleneck: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                        <div>
                          <p className="font-medium">{bottleneck.nodeName}</p>
                          <p className="text-sm text-muted-foreground">{bottleneck.type}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-orange-600">{bottleneck.latency}ms</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Resultados detalhados */}
            <SimulationResultsDisplay results={simulationResults} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <Activity className="w-12 h-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
              <p className="text-muted-foreground">Execute uma simulação para ver os resultados</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

