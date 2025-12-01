import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidDiagramProps {
  chart: string;
}

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      securityLevel: 'loose',
      fontFamily: 'JetBrains Mono',
      flowchart: {
        curve: 'basis',
        htmlLabels: true,
      }
    });
  }, []);

  useEffect(() => {
    const renderChart = async () => {
      if (containerRef.current) {
        try {
            setIsError(false);
            containerRef.current.innerHTML = '';
            const id = `mermaid-${crypto.randomUUID()}`;
            
            // Clean up the chart string
            // 1. Remove markdown code blocks
            let cleanChart = chart
                .replace(/```mermaid/g, '')
                .replace(/```/g, '')
                .trim();

            // 2. CRITICAL FIX: Force newline after graph definition
            // Solves "Parse error on line 1... Expecting 'NEWLINE', got 'NODE_STRING'"
            // Matches "graph TD Node" -> "graph TD\nNode"
            cleanChart = cleanChart.replace(/^(graph [A-Z]{2}|flowchart [A-Z]{2}|sequenceDiagram|classDiagram|stateDiagram|erDiagram|journey|gantt|pie|gitGraph)[ \t]+(?![\n])/g, '$1\n');

            // 3. Sanitization: Replace parentheses inside brackets [] ONLY if not quoted
            cleanChart = cleanChart.replace(/\[([\s\S]*?)\]/g, (match, content) => {
                if (!content.includes('"')) {
                    const sanitized = content.replace(/[()]/g, ' ');
                    return `[${sanitized}]`;
                }
                return match;
            });
            
            const { svg } = await mermaid.render(id, cleanChart);
            if (containerRef.current) {
                containerRef.current.innerHTML = svg;
            }
        } catch (error) {
          console.error('Mermaid render error:', error);
          setIsError(true);
        }
      }
    };

    renderChart();
  }, [chart]);

  if (isError) {
      return (
          <div className="flex flex-col items-center justify-center h-64 border border-cyber-700 rounded-lg bg-cyber-900/50 p-4 text-cyber-danger gap-2">
              <p className="font-bold">Rendering Error</p>
              <p className="text-xs font-mono opacity-70">The diagram syntax was invalid. Try regenerating.</p>
              <pre className="text-[10px] text-gray-500 overflow-hidden max-w-full text-left bg-black/50 p-2 rounded w-full">
                {chart.substring(0, 100)}...
              </pre>
          </div>
      )
  }

  return (
    <div className="w-full overflow-x-auto p-4 bg-cyber-800/50 rounded-xl border border-cyber-700 min-h-[400px] flex items-center justify-center shadow-inner relative group">
       <div className="absolute top-2 right-2 text-[10px] text-gray-600 font-mono group-hover:text-cyber-accent transition-colors">LIVE_PREVIEW</div>
      <div ref={containerRef} className="w-full flex justify-center mermaid-canvas" />
    </div>
  );
};

export default MermaidDiagram;