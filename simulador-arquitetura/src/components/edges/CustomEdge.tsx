import { EdgeProps, getBezierPath } from 'reactflow';
import { useState } from 'react';

// Definição dos protocolos suportados
const protocolColors = {
  kafka: '#ff9800',   // laranja para Kafka
  http: '#2196f3',    // azul para HTTP
  grpc: '#4caf50',    // verde para gRPC
  rabbitmq: '#9c27b0' // roxo para RabbitMQ
};

const protocolLabels = {
  kafka: 'Kafka',
  http: 'HTTP',
  grpc: 'gRPC',
  rabbitmq: 'RabbitMQ'
};

export function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
  selected,
}: EdgeProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Calcular o caminho da aresta
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Obter a latência e o protocolo da conexão (ou usar valores padrão)
  const latency = data?.latency || 10;
  const protocol = data?.protocol || 'kafka';
  const topicName = data?.topicName || '';
  const queueName = data?.queueName || '';
  const requestCount = data?.requestCount || 0;
  
  // Determinar a cor com base no protocolo e na latência
  const getStrokeColor = () => {
    // Cor base do protocolo
    const baseColor = protocolColors[protocol as keyof typeof protocolColors] || protocolColors.kafka;
    
    // Ajustar a opacidade com base na latência
    if (latency < 20) return baseColor; // cor normal para baixa latência
    if (latency < 50) return baseColor + 'cc'; // cor com opacidade reduzida para média latência
    return baseColor + '99'; // cor com opacidade ainda mais reduzida para alta latência
  };

  const strokeColor = getStrokeColor();
  const strokeWidth = selected || isHovered ? 3 : 2;
  const strokeDasharray = protocol === 'http' ? '5,5' : protocol === 'grpc' ? '10,2' : undefined;

  // Definir o marcador de seta para indicar direção do fluxo
  const arrowMarker = `url(#${protocol}-arrow)`;

  return (
    <>
      {/* Definição do marcador de seta para cada protocolo */}
      <defs>
        <marker
          id={`${protocol}-arrow`}
          viewBox="0 0 10 10"
          refX="5"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path
            d="M 0 0 L 10 5 L 0 10 z"
            fill={strokeColor}
          />
        </marker>
      </defs>
      
      <path
        id={id}
        style={{
          ...style,
          strokeWidth,
          stroke: strokeColor,
          strokeDasharray,
        }}
        className="react-flow__edge-path transition-all duration-300"
        d={edgePath}
        markerEnd={arrowMarker}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />
      
      {/* Rótulo de latência e protocolo */}
      <foreignObject
        width={120}
        height={50}
        x={labelX - 60}
        y={labelY - 25}
        className="overflow-visible"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className={`
            flex flex-col items-center justify-center
            bg-white border rounded-md px-2 py-1 shadow-sm
            text-xs font-medium
            transition-all duration-300
            ${selected || isHovered ? 'scale-110' : 'scale-100'}
          `}
          style={{ borderColor: strokeColor }}
        >
          <div className="flex items-center gap-1">
            <span style={{ color: strokeColor }}>{protocolLabels[protocol as keyof typeof protocolLabels]}</span>
            <span className="text-gray-500">|</span>
            <span style={{ color: strokeColor }}>{latency} ms</span>
          </div>
          {(protocol === 'kafka' && topicName) && (
            <div className="text-gray-500 text-xs mt-0.5">
              Tópico: {topicName}
            </div>
          )}
          {(protocol === 'rabbitmq' && queueName) && (
            <div className="text-gray-500 text-xs mt-0.5">
              Fila: {queueName}
            </div>
          )}
          {requestCount > 0 && (
            <div className="text-gray-500 text-xs mt-0.5">
              Requests: {requestCount}
            </div>
          )}
        </div>
      </foreignObject>
    </>
  );
}
