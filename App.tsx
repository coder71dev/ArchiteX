import React, { useState } from 'react';
import { generateBlueprint, simulateChaos, explainLikeImFive, generateComponentCode } from './services/geminiService';
import { ProjectBlueprint, ChaosEvent, AppState, GeneratedCode, BlueprintTab } from './types';
import MermaidDiagram from './components/MermaidDiagram';
import MatrixRain from './components/MatrixRain';
import { 
  Terminal, 
  Cpu, 
  Activity, 
  Zap, 
  ShieldAlert, 
  Server, 
  Code,
  X,
  Copy,
  Check,
  Layout,
  Database,
  GitBranch,
  List,
  Map,
  Layers,
  Box,
  FileText
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const App: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [blueprint, setBlueprint] = useState<ProjectBlueprint | null>(null);
  const [activeTab, setActiveTab] = useState<BlueprintTab>('overview');
  const [chaosEvent, setChaosEvent] = useState<ChaosEvent | null>(null);
  const [eli5Mode, setEli5Mode] = useState(false);
  const [eli5Overview, setEli5Overview] = useState<string | null>(null);
  const [loadingMsg, setLoadingMsg] = useState('');
  
  // Code Gen State
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setAppState(AppState.GENERATING_BLUEPRINT);
    setLoadingMsg("Designing System Architecture...");
    setBlueprint(null);
    setChaosEvent(null);
    setEli5Overview(null);
    setEli5Mode(false);
    setGeneratedCode(null);
    setActiveTab('overview');

    try {
      const result = await generateBlueprint(prompt);
      setBlueprint(result);
      setAppState(AppState.VIEWING_BLUEPRINT);
    } catch (error) {
      console.error(error);
      alert("The Architect is overwhelmed. Please try again.");
      setAppState(AppState.IDLE);
    }
  };

  const handleChaos = async () => {
    if (!blueprint) return;
    setAppState(AppState.SIMULATING_CHAOS);
    setLoadingMsg("Injecting failure vectors...");
    try {
      const event = await simulateChaos(blueprint);
      setChaosEvent(event);
      setAppState(AppState.CHAOS_REPORT);
    } catch (error) {
      console.error(error);
      setAppState(AppState.VIEWING_BLUEPRINT);
    }
  };

  const handleGenerateCode = async (componentName: string, tech: string) => {
      if (!blueprint) return;
      setAppState(AppState.GENERATING_CODE);
      setLoadingMsg(`Scaffolding ${componentName}...`);
      try {
          const code = await generateComponentCode(componentName, tech, blueprint.overview);
          setGeneratedCode(code);
          setAppState(AppState.VIEWING_CODE);
      } catch (e) {
          console.error(e);
          setAppState(AppState.VIEWING_BLUEPRINT);
      }
  };

  const toggleEli5 = async () => {
      if (!blueprint) return;
      if (!eli5Mode && !eli5Overview) {
         try {
            const simple = await explainLikeImFive(blueprint.overview);
            setEli5Overview(simple);
         } catch (e) { console.error(e); }
      }
      setEli5Mode(!eli5Mode);
  };

  const copyToClipboard = () => {
      if (generatedCode) {
          navigator.clipboard.writeText(generatedCode.code);
          setCodeCopied(true);
          setTimeout(() => setCodeCopied(false), 2000);
      }
  };

  const closeCodeModal = () => {
      setGeneratedCode(null);
      setAppState(blueprint ? AppState.VIEWING_BLUEPRINT : AppState.IDLE);
  };

  const reset = () => {
    setAppState(AppState.IDLE);
    setPrompt('');
    setBlueprint(null);
    setChaosEvent(null);
    setGeneratedCode(null);
  };

  // ------------------------------------------
  // RENDER HELPERS
  // ------------------------------------------

  const renderSidebar = () => (
    <div className="hidden lg:flex flex-col w-64 bg-cyber-900/50 border-r border-cyber-700 p-4 space-y-2 h-[calc(100vh-64px)] sticky top-16">
       <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-3">Engineering Plan</div>
       
       <button onClick={() => setActiveTab('scope')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'scope' ? 'bg-cyber-700 text-cyber-accent' : 'text-gray-400 hover:bg-cyber-800'}`}>
          <List className="w-4 h-4" /> 1. Scope Freeze
       </button>
       
       <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'overview' ? 'bg-cyber-700 text-cyber-accent' : 'text-gray-400 hover:bg-cyber-800'}`}>
          <Layout className="w-4 h-4" /> 2-3. Strategy & HLD
       </button>
       
       <button onClick={() => setActiveTab('data')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'data' ? 'bg-cyber-700 text-cyber-accent' : 'text-gray-400 hover:bg-cyber-800'}`}>
          <Database className="w-4 h-4" /> 4. DB Modeling
       </button>
       
        <button onClick={() => setActiveTab('components')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'components' ? 'bg-cyber-700 text-cyber-accent' : 'text-gray-400 hover:bg-cyber-800'}`}>
          <Box className="w-4 h-4" /> 5. LLD & Specs
       </button>

       <button onClick={() => setActiveTab('flow')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'flow' ? 'bg-cyber-700 text-cyber-accent' : 'text-gray-400 hover:bg-cyber-800'}`}>
          <Map className="w-4 h-4" /> 7. Client Flow
       </button>
       
       <button onClick={() => setActiveTab('roadmap')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'roadmap' ? 'bg-cyber-700 text-cyber-accent' : 'text-gray-400 hover:bg-cyber-800'}`}>
          <GitBranch className="w-4 h-4" /> 8. Roadmap
       </button>

       <div className="mt-auto pt-4 border-t border-cyber-700">
           <div className="bg-cyber-800/50 rounded-lg p-3">
               <div className="flex justify-between items-center mb-2">
                   <span className="text-xs text-gray-400">Readiness Score</span>
                   <span className={`text-xs font-bold ${blueprint!.reliabilityScore > 80 ? 'text-green-500' : 'text-yellow-500'}`}>{blueprint!.reliabilityScore}%</span>
               </div>
               <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                   <div className={`h-full ${blueprint!.reliabilityScore > 80 ? 'bg-green-500' : 'bg-yellow-500'}`} style={{ width: `${blueprint!.reliabilityScore}%` }}></div>
               </div>
           </div>
       </div>
    </div>
  );

  const renderContent = () => {
      if (!blueprint) return null;

      switch(activeTab) {
          case 'overview':
              return (
                  <div className="space-y-6 animate-fade-in">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Left: Diagram */}
                          <div className="space-y-2">
                             <div className="flex justify-between items-center">
                                 <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">High Level Architecture (HLD)</h3>
                                 <span className="text-[10px] bg-cyber-800 px-2 py-1 rounded text-gray-500">Mermaid.js</span>
                             </div>
                             <div className="bg-cyber-800/30 border border-cyber-700 rounded-xl overflow-hidden min-h-[400px]">
                                 <MermaidDiagram chart={blueprint.architecture.hldMermaid} />
                             </div>
                          </div>
                          
                          {/* Right: Spec */}
                          <div className="space-y-6">
                              <div className="bg-cyber-800/30 border border-cyber-700 rounded-xl p-6">
                                  <h3 className="text-lg font-bold text-white mb-4 border-b border-cyber-700 pb-2">Strategic Vision</h3>
                                  <div className="prose prose-invert prose-sm mb-4">
                                      {eli5Mode ? (
                                          <p className="text-purple-300 italic">{eli5Overview || "Translating..."}</p>
                                      ) : (
                                          <ReactMarkdown>{blueprint.overview}</ReactMarkdown>
                                      )}
                                  </div>
                                  
                                  <div className="bg-cyber-900/50 rounded-lg p-4 border-l-2 border-cyber-accent">
                                      <h4 className="text-sm font-bold text-cyber-accent mb-1">2. Strategy Decision: {blueprint.strategy.decision}</h4>
                                      <ul className="list-disc list-inside text-xs text-gray-400 space-y-1">
                                          {blueprint.strategy.tradeoffs.map((t,i) => <li key={i}>{t}</li>)}
                                      </ul>
                                  </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {blueprint.techStack.map((cat) => (
                                      <div key={cat.category} className="bg-cyber-800/30 border border-cyber-700 rounded-lg p-4">
                                          <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">{cat.category} Standards</h4>
                                          <div className="flex flex-wrap gap-2">
                                              {cat.items.map(tech => (
                                                  <span key={tech} className="px-2 py-1 bg-cyber-900 rounded text-xs text-cyber-400 border border-cyber-800">{tech}</span>
                                              ))}
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      </div>
                  </div>
              );
          
          case 'scope':
              return (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
                      <div className="bg-cyber-800/30 border border-cyber-700 rounded-xl p-6 relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-full h-1 bg-green-500"></div>
                          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Check className="w-5 h-5 text-green-500" /> MVP Scope</h3>
                          <p className="text-xs text-gray-500 mb-4">Critical path features for immediate launch.</p>
                          <ul className="space-y-3">
                              {blueprint.scope.mvp.map((item, i) => (
                                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5"></div>
                                      {item}
                                  </li>
                              ))}
                          </ul>
                      </div>

                      <div className="bg-cyber-800/30 border border-cyber-700 rounded-xl p-6 relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
                          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Layers className="w-5 h-5 text-blue-500" /> V1.0 Scope</h3>
                          <p className="text-xs text-gray-500 mb-4">Fast-follow features for market maturity.</p>
                          <ul className="space-y-3">
                              {blueprint.scope.v1.map((item, i) => (
                                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5"></div>
                                      {item}
                                  </li>
                              ))}
                          </ul>
                      </div>

                      <div className="bg-cyber-800/30 border border-cyber-700 rounded-xl p-6 relative overflow-hidden opacity-75">
                          <div className="absolute top-0 left-0 w-full h-1 bg-purple-500"></div>
                          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Zap className="w-5 h-5 text-purple-500" /> Future</h3>
                          <p className="text-xs text-gray-500 mb-4">Long-term vision and R&D.</p>
                          <ul className="space-y-3">
                              {blueprint.scope.future.map((item, i) => (
                                  <li key={i} className="flex items-start gap-2 text-sm text-gray-400 italic">
                                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5"></div>
                                      {item}
                                  </li>
                              ))}
                          </ul>
                      </div>
                  </div>
              );

          case 'data':
               return (
                  <div className="animate-fade-in space-y-4">
                      <div className="flex items-center justify-between">
                          <h3 className="text-lg font-bold text-white">4. Database Modeling</h3>
                          <span className="text-xs text-gray-500 font-mono">Entity Relationship Diagram</span>
                      </div>
                      <div className="bg-cyber-800/30 border border-cyber-700 rounded-xl p-2 min-h-[500px]">
                          <MermaidDiagram chart={blueprint.architecture.dbMermaid} />
                      </div>
                  </div>
               );

          case 'flow':
               return (
                  <div className="animate-fade-in space-y-4">
                      <div className="flex items-center justify-between">
                          <h3 className="text-lg font-bold text-white">7. Frontend/Client Apps Flow</h3>
                          <span className="text-xs text-gray-500 font-mono">User Journey Map</span>
                      </div>
                      <div className="bg-cyber-800/30 border border-cyber-700 rounded-xl p-2 min-h-[500px]">
                          <MermaidDiagram chart={blueprint.architecture.frontendMermaid} />
                      </div>
                  </div>
               );

          case 'components':
               return (
                  <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {blueprint.componentDetails.map((comp) => (
                          <div key={comp.name} className="bg-cyber-800/30 border border-cyber-700 rounded-xl p-6 hover:bg-cyber-800/50 transition-colors group">
                              <div className="flex justify-between items-start mb-4">
                                  <div>
                                      <h4 className="text-lg font-bold text-cyber-accent font-mono">{comp.name}</h4>
                                      <span className="text-xs text-gray-500 uppercase tracking-wider">{comp.type}</span>
                                  </div>
                                  <button 
                                    onClick={() => handleGenerateCode(comp.name, comp.tech)}
                                    className="p-2 bg-cyber-900 border border-cyber-700 rounded-lg text-gray-400 hover:text-white hover:border-cyber-accent transition-all"
                                    title="Generate Scaffold"
                                  >
                                      <Code className="w-5 h-5" />
                                  </button>
                              </div>
                              <p className="text-sm text-gray-300 mb-4">{comp.description}</p>
                              
                              <div className="bg-black/30 rounded p-3 font-mono text-xs text-gray-400 border-l-2 border-cyber-600">
                                  <div className="text-gray-500 mb-1 select-none flex items-center gap-1"><FileText className="w-3 h-3"/> LLD / Interface Spec:</div>
                                  {comp.interfaceSpec || "Standard Interface"}
                              </div>
                              <div className="mt-4 flex items-center gap-2">
                                  <span className="text-[10px] bg-cyber-900 px-2 py-1 rounded text-cyber-400 border border-cyber-800">{comp.tech}</span>
                              </div>
                          </div>
                      ))}
                  </div>
               );

          case 'roadmap':
              return (
                  <div className="animate-fade-in max-w-4xl mx-auto space-y-8">
                      {blueprint.roadmap.map((phase, idx) => (
                          <div key={idx} className="relative pl-8 border-l-2 border-cyber-700 last:border-0 pb-8">
                              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-cyber-900 border-2 border-cyber-500"></div>
                              <div className="bg-cyber-800/30 border border-cyber-700 rounded-xl p-6">
                                  <div className="flex justify-between items-center mb-4">
                                      <h3 className="text-xl font-bold text-white">{phase.phase}</h3>
                                      <span className="text-sm font-mono text-cyber-accent bg-cyber-900/50 px-3 py-1 rounded-full">{phase.timeline}</span>
                                  </div>
                                  <ul className="space-y-3">
                                      {phase.milestones.map((m, i) => (
                                          <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                                              <div className="w-1.5 h-1.5 bg-gray-600 rounded-full"></div>
                                              {m}
                                          </li>
                                      ))}
                                  </ul>
                              </div>
                          </div>
                      ))}
                  </div>
              );
              
          default:
              return null;
      }
  };


  // ------------------------------------------
  // MAIN RENDER
  // ------------------------------------------
  
  return (
    <div className="min-h-screen text-gray-200 font-sans selection:bg-cyber-accent selection:text-black">
      <MatrixRain />
      
      {/* Header */}
      <header className="border-b border-cyber-700 bg-cyber-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={reset}>
            <div className="p-2 bg-cyber-500/20 rounded-lg border border-cyber-500/50">
              <Cpu className="w-6 h-6 text-cyber-accent" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">ArchiteX</h1>
              <p className="text-xs text-cyber-400 font-mono">Enterprise Engineering Suite</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             {blueprint && (
                 <div className="hidden md:flex items-center gap-2 mr-4">
                     <span className="text-sm font-bold text-gray-300">{blueprint.title}</span>
                     <span className="text-xs text-gray-500 bg-cyber-900 px-2 py-1 rounded">{blueprint.id.split('-')[0]}</span>
                 </div>
             )}
             <button onClick={handleChaos} disabled={!blueprint} className="text-gray-400 hover:text-red-400 transition-colors" title="Trigger Chaos">
                <ShieldAlert className="w-5 h-5" />
             </button>
          </div>
        </div>
      </header>

      {/* IDLE STATE */}
      {appState === AppState.IDLE && (
        <main className="max-w-4xl mx-auto px-6 py-20 min-h-[80vh] flex flex-col items-center justify-center animate-fade-in">
          <div className="w-full text-center space-y-8">
            <h2 className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyber-accent via-blue-500 to-purple-600 pb-2">
              Engineering Singularity
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
              Describe your system. ArchiteX will generate the <span className="text-cyber-accent">Scope Freeze</span>, <span className="text-blue-400">DB Schema</span>, <span className="text-purple-400">LLD Specs</span>, and <span className="text-green-400">Roadmap</span> instantly.
            </p>
            
            <form onSubmit={handleGenerate} className="relative group max-w-2xl mx-auto w-full">
              <div className="absolute inset-0 bg-gradient-to-r from-cyber-accent to-purple-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
              <div className="relative flex items-center">
                <Terminal className="absolute left-4 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. A high-frequency trading platform for crypto..."
                  className="w-full bg-cyber-800 border-2 border-cyber-700 text-white pl-12 pr-32 py-4 rounded-lg focus:outline-none focus:border-cyber-accent focus:ring-1 focus:ring-cyber-accent transition-all text-lg font-mono placeholder-gray-600"
                />
                <button 
                  type="submit"
                  className="absolute right-2 px-6 py-2 bg-cyber-500 hover:bg-cyber-400 text-white font-semibold rounded-md transition-colors flex items-center gap-2"
                >
                  Architect <Zap className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </main>
      )}

      {/* LOADING */}
      {(appState === AppState.GENERATING_BLUEPRINT || appState === AppState.SIMULATING_CHAOS || appState === AppState.GENERATING_CODE) && (
        <main className="min-h-[80vh] flex flex-col items-center justify-center">
             <div className="relative">
                <div className="w-20 h-20 border-4 border-cyber-700 border-t-cyber-accent rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                   <Activity className="w-8 h-8 text-cyber-accent animate-pulse" />
                </div>
             </div>
             <p className="mt-8 text-2xl font-mono text-cyber-accent animate-pulse tracking-tight">{loadingMsg}</p>
             <div className="mt-4 flex gap-2">
                 <span className="w-2 h-2 bg-cyber-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                 <span className="w-2 h-2 bg-cyber-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                 <span className="w-2 h-2 bg-cyber-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
             </div>
        </main>
      )}

      {/* DASHBOARD VIEW */}
      {(appState === AppState.VIEWING_BLUEPRINT || appState === AppState.CHAOS_REPORT || appState === AppState.VIEWING_CODE) && blueprint && (
          <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row">
              {/* Sidebar Navigation */}
              {renderSidebar()}

              {/* Mobile Nav */}
              <div className="lg:hidden overflow-x-auto whitespace-nowrap p-4 flex gap-2 border-b border-cyber-700 bg-cyber-900/50">
                   {['overview', 'scope', 'data', 'flow', 'components', 'roadmap'].map((t) => (
                       <button 
                         key={t}
                         onClick={() => setActiveTab(t as any)} 
                         className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider ${activeTab === t ? 'bg-cyber-700 text-white' : 'bg-cyber-800 text-gray-400'}`}
                       >
                           {t}
                       </button>
                   ))}
              </div>

              {/* Main Content Area */}
              <main className={`flex-1 p-6 lg:p-10 transition-opacity duration-300 ${appState === AppState.VIEWING_CODE ? 'opacity-20 blur-sm pointer-events-none' : 'opacity-100'}`}>
                   
                   {/* Chaos Notification Overlay */}
                   {appState === AppState.CHAOS_REPORT && chaosEvent && (
                     <div className="mb-8 bg-red-950/40 border border-red-500/50 rounded-xl p-6 relative overflow-hidden animate-slide-in shadow-2xl shadow-red-900/20">
                        <div className="flex items-start gap-5">
                           <div className="p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                              <ShieldAlert className="w-10 h-10 text-red-500" />
                           </div>
                           <div className="flex-1">
                              <div className="flex justify-between items-start">
                                  <div>
                                    <h3 className="text-2xl font-bold text-red-400 mb-1">System Critical Failure</h3>
                                    <p className="text-sm font-mono text-red-300/70 mb-4">INCIDENT_ID: {crypto.randomUUID().split('-')[0]}</p>
                                  </div>
                                  <button onClick={() => setAppState(AppState.VIEWING_BLUEPRINT)} className="text-red-400 hover:text-white px-3 py-1 bg-red-900/30 rounded border border-red-800 text-xs">Acknowledge</button>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-2">
                                 <div>
                                    <div className="text-xs font-bold text-red-600 uppercase tracking-widest mb-2">Diagnosis</div>
                                    <div className="text-lg text-white font-medium mb-1">{chaosEvent.failureType}</div>
                                    <div className="text-sm text-red-200">Component: <span className="font-mono bg-red-900/50 px-1 rounded">{chaosEvent.targetComponent}</span></div>
                                 </div>
                                 <div>
                                    <div className="text-xs font-bold text-green-600 uppercase tracking-widest mb-2">Resolution Protocol</div>
                                    <p className="text-sm text-gray-300 leading-relaxed">{chaosEvent.mitigationStrategy}</p>
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>
                  )}
                  
                  {renderContent()}
              </main>
          </div>
      )}

      {/* CODE MODAL */}
      {appState === AppState.VIEWING_CODE && generatedCode && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={closeCodeModal}></div>
                <div className="relative bg-[#0d1117] border border-gray-700 rounded-xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl animate-fade-in-up">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-[#161b22] rounded-t-xl">
                        <div className="flex items-center gap-3">
                            <Code className="w-5 h-5 text-blue-400" />
                            <div>
                                <h3 className="font-mono text-sm font-bold text-gray-200">{generatedCode.filename}</h3>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={closeCodeModal} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-auto p-0 relative custom-scrollbar bg-[#0d1117]">
                        <pre className="p-6 text-sm font-mono leading-relaxed">
                            <code className="text-gray-300">{generatedCode.code}</code>
                        </pre>
                        <button 
                            onClick={copyToClipboard}
                            className="absolute top-4 right-4 p-2 bg-gray-800/80 backdrop-blur border border-gray-700 hover:border-gray-500 text-gray-300 rounded-lg transition-all shadow-lg flex items-center gap-2 text-xs font-medium"
                        >
                            {codeCopied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                            {codeCopied ? "Copied" : "Copy"}
                        </button>
                    </div>
                </div>
            </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #374151; border-radius: 20px; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slide-in { from { transform: translateX(-20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.5s ease-out; }
        .animate-fade-in-up { animation: fade-in-up 0.6s ease-out; }
        .animate-slide-in { animation: slide-in 0.4s ease-out; }
      `}</style>
    </div>
  );
};

export default App;