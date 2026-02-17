import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Risk } from '../types/risk';
import { generateNetworkData, NetworkNode, CorrelationLink } from '../lib/correlation';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { 
  ZoomIn, 
  ZoomOut, 
  GitBranch, 
  AlertTriangle,
} from 'lucide-react';
import { cn, getRiskLevel } from '../lib/utils';
import { useLanguage } from '../contexts/LanguageContext';

interface RiskNetworkProps {
  risks: Risk[];
  onRiskClick?: (riskId: string) => void;
}

// D3 simulation types
interface SimulationNode extends NetworkNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export function RiskNetwork({ risks, onRiskClick }: RiskNetworkProps) {
  const { t } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [filterType, setFilterType] = useState<'all' | 'high' | 'correlated'>('all');
  
  const { nodes, links } = useMemo(() => generateNetworkData(risks), [risks]);

  // Use refs for simulation state to avoid re-renders resetting the physics
  const simulationNodesRef = useRef<SimulationNode[]>([]);
  const hoverRef = useRef<string | null>(null);
  const selectedRef = useRef<string | null>(null);

  // Sync refs with state
  useEffect(() => { hoverRef.current = hoveredNode; }, [hoveredNode]);
  useEffect(() => { selectedRef.current = selectedNode; }, [selectedNode]);

  // Filter nodes based on selection
  const visibleNodes = useMemo(() => {
    let filtered = nodes;
    if (filterType === 'high') filtered = nodes.filter(n => n.score >= 15);
    else if (filterType === 'correlated') {
      const linkedNodeIds = new Set(links.flatMap(l => [l.source, l.target]));
      filtered = nodes.filter(n => linkedNodeIds.has(n.id));
    }
    return filtered;
  }, [nodes, links, filterType]);

  const visibleLinks = useMemo(() => {
    const visibleIds = new Set(visibleNodes.map(n => n.id));
    return links.filter(l => visibleIds.has(l.source) && visibleIds.has(l.target));
  }, [visibleNodes, links]);

  // Initialize nodes
  useEffect(() => {
    const width = 800;
    const height = 500;

    // Map existing positions to new nodes to prevent jumping
    simulationNodesRef.current = visibleNodes.map(n => {
        const existing = simulationNodesRef.current.find(en => en.id === n.id);
        if (existing) {
             return { ...n, x: existing.x, y: existing.y, vx: existing.vx, vy: existing.vy };
        }
        return {
            ...n,
            x: width / 2 + (Math.random() - 0.5) * 200,
            y: height / 2 + (Math.random() - 0.5) * 200,
            vx: 0,
            vy: 0
        };
    });
  }, [visibleNodes]);

  // D3 Force Simulation Effect
  useEffect(() => {
    if (!canvasRef.current || visibleNodes.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    let animationId: number;

    const simulation = () => {
      const currentNodes = simulationNodesRef.current;
      const currentHover = hoverRef.current;
      const currentSelected = selectedRef.current;

      // Forces
      const centerForce = 0.05;
      const repelForce = 2000;
      const linkDistance = 100;
      const linkStrength = 0.1;

      // Apply forces
      for (let i = 0; i < currentNodes.length; i++) {
        const node = currentNodes[i];
        
        // Center force
        node.vx += (width / 2 - node.x) * centerForce * 0.1;
        node.vy += (height / 2 - node.y) * centerForce * 0.1;

        // Repulsion between nodes
        for (let j = i + 1; j < currentNodes.length; j++) {
          const other = currentNodes[j];
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = repelForce / (dist * dist);
          
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          
          node.vx += fx;
          node.vy += fy;
          other.vx -= fx;
          other.vy -= fy;
        }
      }

      // Link force
      visibleLinks.forEach(link => {
        const source = currentNodes.find(n => n.id === link.source);
        const target = currentNodes.find(n => n.id === link.target);
        if (!source || !target) return;

        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (dist - linkDistance) * linkStrength;
        
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        
        source.vx += fx;
        source.vy += fy;
        target.vx -= fx;
        target.vy -= fy;
      });

      // Update positions with damping
      currentNodes.forEach(node => {
        node.vx *= 0.9; // damping
        node.vy *= 0.9;
        node.x += node.vx;
        node.y += node.vy;

        // Boundary constraints
        const padding = 30;
        node.x = Math.max(padding, Math.min(width - padding, node.x));
        node.y = Math.max(padding, Math.min(height - padding, node.y));
      });

      // Render
      ctx.save();
      ctx.clearRect(0, 0, width, height);
      ctx.scale(zoom, zoom);
      
      // Center zoom
      const centerX = width / 2;
      const centerY = height / 2;
      ctx.translate(centerX * (1 - 1/zoom), centerY * (1 - 1/zoom));

      // Draw links
      visibleLinks.forEach(link => {
        const source = currentNodes.find(n => n.id === link.source);
        const target = currentNodes.find(n => n.id === link.target);
        if (!source || !target) return;

        const isHighlighted = currentHover === link.source || currentHover === link.target;
        const isSelected = currentSelected === link.source || currentSelected === link.target;

        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.strokeStyle = isHighlighted ? '#22d3ee' : isSelected ? '#06b6d4' : '#475569';
        ctx.lineWidth = isHighlighted ? 2 : 1;
        ctx.globalAlpha = link.strength * 0.8;
        ctx.stroke();
        ctx.globalAlpha = 1;

        if (isHighlighted || isSelected) {
          const midX = (source.x + target.x) / 2;
          const midY = (source.y + target.y) / 2;
          ctx.fillStyle = '#22d3ee';
          ctx.font = '10px sans-serif';
          ctx.fillText(`${(link.strength * 100).toFixed(0)}%`, midX, midY);
        }
      });

      // Draw nodes
      currentNodes.forEach(node => {
        const riskLevel = getRiskLevel(node.score);
        const isHovered = currentHover === node.id;
        const isSelected = currentSelected === node.id;
        const radius = 8 + (node.score / 25) * 12;

        // Glow effect for critical nodes
        if (node.score >= 20) {
          const gradient = ctx.createRadialGradient(node.x, node.y, radius, node.x, node.y, radius + 10);
          gradient.addColorStop(0, '#ef4444'); // red-500
          gradient.addColorStop(1, 'transparent');
          ctx.fillStyle = gradient;
          ctx.globalAlpha = 0.3;
          ctx.beginPath();
          ctx.arc(node.x, node.y, radius + 10, 0, 2 * Math.PI);
          ctx.fill();
          ctx.globalAlpha = 1;
        }

        // Node circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, isHovered ? radius + 2 : radius, 0, 2 * Math.PI);
        ctx.fillStyle = node.type === 'risk' ? '#0ea5e9' : '#f59e0b';
        ctx.fill();
        
        // Border
        ctx.strokeStyle = isSelected ? '#22d3ee' : isHovered ? '#ffffff' : '#1e293b';
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.stroke();

        // Label
        if (isHovered || isSelected || node.score >= 20) {
          ctx.fillStyle = '#e2e8f0';
          ctx.font = '11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(node.title.substring(0, 20) + (node.title.length > 20 ? '...' : ''), node.x, node.y + radius + 15);
        }

        // Score badge
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(node.x + radius - 2, node.y - radius + 2, 8, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.score.toString(), node.x + radius - 2, node.y - radius + 2);
      });

      ctx.restore();

      animationId = requestAnimationFrame(simulation);
    };

    simulation();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [visibleNodes, visibleLinks, zoom]);

  // Handle mouse interactions
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    const hovered = simulationNodesRef.current.find(node => {
      const radius = 8 + (node.score / 25) * 12;
      const dx = x - node.x;
      const dy = y - node.y;
      return Math.sqrt(dx * dx + dy * dy) < radius + 10;
    });

    setHoveredNode(hovered?.id || null);
  };

  const handleClick = () => {
    if (hoveredNode) {
      setSelectedNode(hoveredNode);
      onRiskClick?.(hoveredNode);
    }
  };

  const selectedRisk = risks.find(r => r.id === selectedNode);

  return (
    <div className="space-y-4">
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-cyan-400" />
            <CardTitle className="text-lg text-slate-100">{t.riskNetwork || 'Risk Correlation Network'}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
              <Button
                size="sm"
                variant={filterType === 'all' ? 'secondary' : 'ghost'}
                onClick={() => setFilterType('all')}
                className="text-xs"
              >
                All
              </Button>
              <Button
                size="sm"
                variant={filterType === 'high' ? 'secondary' : 'ghost'}
                onClick={() => setFilterType('high')}
                className="text-xs"
              >
                High Risk
              </Button>
              <Button
                size="sm"
                variant={filterType === 'correlated' ? 'secondary' : 'ghost'}
                onClick={() => setFilterType('correlated')}
                className="text-xs"
              >
                Correlated
              </Button>
            </div>
            <div className="h-6 w-px bg-slate-700 mx-1" />
            <Button size="sm" variant="ghost" onClick={() => setZoom(z => Math.min(z * 1.2, 3))}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setZoom(z => Math.max(z / 1.2, 0.5))}>
              <ZoomOut className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div ref={containerRef} className="relative">
            <canvas
              ref={canvasRef}
              width={800}
              height={500}
              className="w-full rounded-lg bg-slate-950 cursor-crosshair border border-slate-800"
              onMouseMove={handleMouseMove}
              onClick={handleClick}
            />
            
            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur border border-slate-700 rounded-lg p-3 text-xs space-y-2 pointer-events-none">
              <div className="font-medium text-slate-300 mb-2">Legend</div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-sky-500" />
                <span className="text-slate-400">Risk (Future)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-slate-400">Issue (Occurred)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 bg-slate-600" />
                <span className="text-slate-400">Correlation</span>
              </div>
            </div>

            {/* Selected Node Info */}
            {selectedRisk && (
              <div className="absolute top-4 right-4 w-64 bg-slate-900/95 backdrop-blur border border-cyan-500/30 rounded-lg p-4 shadow-xl animate-in fade-in slide-in-from-right-4 z-10">
                <div className="flex items-start justify-between mb-2">
                  <Badge className={cn(
                    selectedRisk.score >= 20 ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                    selectedRisk.score >= 15 ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                    'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                  )}>
                    Score: {selectedRisk.score}
                  </Badge>
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setSelectedNode(null)}>
                    ×
                  </Button>
                </div>
                <h4 className="font-medium text-slate-100 text-sm mb-1 line-clamp-2">{selectedRisk.title}</h4>
                <p className="text-xs text-slate-400 mb-3">{selectedRisk.businessUnit}</p>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                    <span className="text-slate-300">
                      {visibleLinks.filter(l => l.source === selectedRisk.id || l.target === selectedRisk.id).length} correlated risks
                    </span>
                  </div>
                  <Button 
                    size="sm" 
                    className="w-full mt-2"
                    onClick={() => onRiskClick?.(selectedRisk.id)}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-800">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-100">{visibleNodes.length}</div>
              <div className="text-xs text-slate-500">Active Nodes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">{visibleLinks.length}</div>
              <div className="text-xs text-slate-500">Correlations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">
                {visibleNodes.filter(n => n.score >= 20).length}
              </div>
              <div className="text-xs text-slate-500">Critical</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-400">
                {visibleLinks.length > 0 ? (visibleLinks.reduce((acc, l) => acc + l.strength, 0) / visibleLinks.length * 100).toFixed(0) : 0}%
              </div>
              <div className="text-xs text-slate-500">Avg Correlation</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}