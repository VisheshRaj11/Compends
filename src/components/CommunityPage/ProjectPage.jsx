import React, { useEffect, useState } from 'react';
import { Tldraw } from 'tldraw';
import 'tldraw/tldraw.css';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  CheckSquare, 
  UserPlus,
  Circle,
  Loader2
} from 'lucide-react';
import { useSupabase } from '@/supabase/client';
import { useLocation, useParams } from 'react-router-dom';

export default function ProjectCanvas() {
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [editor, setEditor] = useState(null);
  const supabase = useSupabase();
  const {projectId} = useParams();
  
  const [assignments] = useState([
    { id: 1, name: "Person 1", task: "React Components", role: "Dev" },
    { id: 2, name: "Person 2", task: "Database Schema", role: "Backend" },
    { id: 3, name: "Person 3", task: "UI/UX Design", role: "Designer" },
    { id: 4, name: "Person 4", task: "API Integration", role: "Dev" },
    { id: 5, name: "Person 5", task: "Testing & QA", role: "QA" },
  ]);

  const saveDrawingToSupabase = async(elements) => {

    if(!elements || !projectId) return ;

    const {error} = await supabase.from('drawings')
    .upsert({
      project_id:projectId,
      elements: elements
    },{onConflict: 'drawings_project_id_unique'});
    
    if(error) {
      console.log("Failed to save drawing: ", error.message);
    }
  }

  const recenterTextShapes = (editor) => {
    const shapes = editor.getCurrentPageShapes();

    const textShapes = shapes.filter(
      s => s.type === 'text' && s.id.startsWith('shape:text_')
    );

    textShapes.forEach(textShape => {
    const parentId = textShape.id.replace('shape:text_', '');

    const parentBounds = editor.getShapePageBounds(parentId);
    const textBounds = editor.getShapePageBounds(textShape.id);

    if (!parentBounds || !textBounds) return;

    editor.updateShape({
      id: textShape.id,
      type: 'text',
      x: parentBounds.x + parentBounds.w / 2 - textBounds.w / 2,
      y: parentBounds.y + parentBounds.h / 2 - textBounds.h / 2,
    });
  });

  }

  useEffect(() => {
    if (!editor || !projectId) return;

    const fetchDrawings = async() => {
      const {error, data} = await supabase.from('drawings').select("*").eq('project_id',projectId).single();
      if(error) {
        console.log("Failed to fetch", error.message);
        return;
      }

      editor.createShapes(data[0].elements);

      setTimeout(() => {
         recenterTextShapes(editor);
      },0)
    }
    fetchDrawings();
  },[editor,supabase, projectId]);

  const handleGenerateAI = async() => {
      if(!editor || !prompt) return;
      setIsGenerating(true);
      try {
        const shapes = editor.getCurrentPageShapes();
        const {data, error} = await supabase.functions.invoke('generate-canvas',{
          body:{prompt: prompt,currentCanvas: shapes}
        });

        if(error) {
          console.log("Error generating canvas", error.message);
          return;
        }

        const aiGenerateData = data;
        if(aiGenerateData?.shapes && Array.isArray(aiGenerateData.shapes)) {
          const extraTextShapes = [];
          const validateShapes = aiGenerateData.shapes.map(shape => {
            const sanitized = {
              id: shape.id || `shape:${crypto.randomUUID()}`,
              type: shape.type,
              x: shape.x || 0,
              y: shape.y || 0,
              rotation: 0,
              index: 'a1',
              parentId: 'page:page',
              typeName: 'shape',
            };
            
            if (shape.type === 'geo') {
              const w = shape.props?.w || 150;
              const h = shape.props?.h || 80;
              sanitized.props = {
                geo: shape.props?.geo || 'rectangle',
                w, h,
                color: shape.props?.color || 'black',
                fill: shape.props?.fill || 'none',
                dash: shape.props?.dash || 'draw',
                size: shape.props?.size || 'm',
              };

              if (shape.props?.text) {
                extraTextShapes.push({
                  id: `shape:text_${sanitized.id}`,
                  type: 'text',
                  x: sanitized.x + w / 2,
                  y: sanitized.y + h / 2,
                  rotation: 0,
                  index: 'a1',
                  parentId: 'page:page',
                  typeName: 'shape',
                  props: {
                    richText: {
                      type: 'doc',
                      content: [{ type: 'paragraph', content: [{ type: 'text', text: shape.props.text }] }],
                    },
                    size: 's',
                  },
                });
              }
            }

            if (shape.type === 'text') {
              sanitized.props = {
                richText: {
                  type: 'doc',
                  content: [{ type: 'paragraph', content: [{ type: 'text', text: shape.props?.text || ' ' }] }],
                },
                color: shape.props?.color || 'black',
                size: shape.props?.size || 'm',
                font: shape.props?.font || 'draw',
              };
            }
            return sanitized; 
          });

          validateShapes.forEach(s => {
            if (s.type === 'text') {
              delete s.props.align; delete s.props.verticalAlign;
              delete s.props.growY; delete s.props.w;
            }
          });

          if(validateShapes.length > 0) {
            editor.markHistoryStoppingPoint('ai-generation');
            const finalShapes = [...validateShapes, ...extraTextShapes];
            editor.createShapes(finalShapes);

            // Save to DB:
            await saveDrawingToSupabase(finalShapes);
            
            setTimeout(() => {
              extraTextShapes.forEach(textShape => {
                const parentId = textShape.id.replace('shape:text_', '');
                const parentBounds = editor.getShapePageBounds(parentId);
                const textBounds = editor.getShapePageBounds(textShape.id);
                if (!parentBounds || !textBounds) return;
                editor.updateShape({
                  id: textShape.id,
                  type: 'text',
                  x: parentBounds.x + parentBounds.w / 2 - textBounds.w / 2,
                  y: parentBounds.y + parentBounds.h / 2 - textBounds.h / 2,
                });
              });
            }, 0);
            editor.zoomToFit();
          }
        }
      } catch (error) {
        console.error("AI Generation failed:", error);
      } finally {
        setIsGenerating(false);
      }
  };

  return (
    <div className="h-screen w-screen flex bg-[#f5f5f7] overflow-hidden relative">
      <AnimatePresence>
        {!isPanelOpen && (
          <motion.button
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
            onClick={() => setIsPanelOpen(true)}
            className="fixed left-0 top-1/2 -translate-y-1/2 z-[100] bg-white border-2 border-l-0 border-black p-3 rounded-r-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-50 transition-all group"
          >
            <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {isPanelOpen && (
          <motion.div
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            className="w-80 h-full bg-white border-r border-gray-200 flex flex-col z-[110] shadow-2xl"
          >
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                  <Sparkles size={18} className="text-white" />
                </div>
                <h2 className="font-bold text-xl text-gray-900 tracking-tight">AI Draw</h2>
              </div>
              <button 
                onClick={() => setIsPanelOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ChevronLeft size={20} className="text-gray-500" />
              </button>
            </div>

            <div 
             onWheel={(e) => e.stopPropagation()}
            className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="p-6 space-y-8">
                <section className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-black">Generate Canvas</label>
                  <div className="space-y-3">
                    <textarea 
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="E.g. Create a login page wireframe..."
                      className="w-full h-32 p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-black text-sm outline-none transition-all resize-none shadow-inner"
                    />
                    <button 
                    onClick={handleGenerateAI}
                    disabled={isGenerating || !prompt}
                    className="w-full py-3 bg-black text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 active:scale-[0.98] transition-all">
                      {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <><Sparkles size={18} /> Generate</>}
                    </button>
                  </div>
                </section>

                <hr className="border-gray-100" />

                <section className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Actions</label>
                  <button className="w-full flex items-center justify-between p-4 bg-white border-2 border-black rounded-xl hover:bg-yellow-50 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[1px] active:translate-y-[1px]">
                    <span className="font-bold flex items-center gap-2 text-sm"><CheckSquare size={18} /> Assign Task</span>
                    <UserPlus size={18} />
                  </button>
                </section>

                <section className="space-y-4 pb-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Live Assignments</label>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {assignments.map((item) => (
                      <div key={item.id} className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-start gap-3 hover:border-black transition-colors">
                        <div className="mt-1"><Circle size={8} className="fill-emerald-500 text-emerald-500" /></div>
                        <div className="flex-1 overflow-hidden">
                          <p className="text-xs font-bold text-gray-900 truncate">{item.name}</p>
                          <p className="text-[11px] text-gray-500 leading-tight">→ {item.task}</p>
                        </div>
                        <span className="text-[9px] font-bold bg-white border border-gray-200 px-1.5 py-0.5 rounded uppercase">{item.role}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 relative h-full">
        <style>{`
          .tl-ui { z-index: 10 !important; }
          .tl-container { background-color: #fafafa !important; }
          
          /* --- TLDR TOOLBAR SCROLLBAR FIX --- */
          /* Targets the bottom toolbar container */
          .tl-ui-layout__bottom {
            max-width: 100%;
            overflow-x: auto;
            padding-bottom: 8px; /* Space for scrollbar */
          }

          /* Ensure the toolbar itself doesn't shrink and allows scrolling */
          .tl-toolbar {
            min-width: max-content;
            margin: 0 auto;
            display: flex !important;
          }

          /* Styling the horizontal scrollbar for the toolbar */
          .tl-ui-layout__bottom::-webkit-scrollbar { height: 4px; }
          .tl-ui-layout__bottom::-webkit-scrollbar-track { background: transparent; }
          .tl-ui-layout__bottom::-webkit-scrollbar-thumb { background: #000; border-radius: 10px; }

          /* Custom Smooth Scrollbar for Left Panel */
          .custom-scrollbar::-webkit-scrollbar { width: 4px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d1d5db; }
        `}</style>
        
        <Tldraw 
          inferDarkMode={false}
          autoFocus
          onMount={(editorInstance) => setEditor(editorInstance)}
        />
      </div>
    </div>
  );
}