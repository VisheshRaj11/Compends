import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Tldraw } from 'tldraw';
import 'tldraw/tldraw.css';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  ChevronLeft,
  Sparkles,
  CheckSquare,
  UserPlus,
  Loader2,
  Cloud
} from 'lucide-react';
import { useSupabase } from '@/supabase/client';
import { useParams } from 'react-router-dom';
import { Button } from '../ui/button';

// Debounce utility
const debounce = (fn, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

export default function ProjectCanvas() {
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editor, setEditor] = useState(null);
  const [assignTask, setAssignTask] = useState(false);
  const [newTask, setNewTask] = useState('');
  const [saveTasks, setSaveTasks] = useState([]);
  const [fetchTasks, setFetchTasks] = useState([]);

  const supabase = useSupabase();
  const { projectId, communityId } = useParams();
  const [communityMembers,setCommunityMembers] = useState([]);

  // console.log(communityId);


  // Save queue
  const saveQueueRef = useRef(Promise.resolve());

  // Save drawing (update → insert fallback)
  const saveDrawingToSupabase = async (elements) => {
    if (!elements || !projectId) return;

    saveQueueRef.current = saveQueueRef.current.then(async () => {
      setIsSaving(true);

      const { error: updateError, count } = await supabase
        .from('drawings')
        .update({ elements })
        .eq('project_id', projectId);

      if (updateError || count === 0) {
        const { error: insertError } = await supabase
          .from('drawings')
          .insert({ project_id: projectId, elements });

        if (insertError) {
          console.error('Insert failed:', insertError.message);
        } else {
          console.log('Inserted');
        }
      } else {
        console.log('Updated');
      }

      setIsSaving(false);
    });
  };

  // Debounced save function
  const saveDebouncedRef = useRef(
    debounce((elements) => {
      saveDrawingToSupabase(elements);
    }, 1000)
  );

  // Utility: recenter text shapes inside parent shapes
  const recenterTextShapes = (editorInstance) => {
    const shapes = editorInstance.getCurrentPageShapes();
    const textShapes = shapes.filter(
      (s) => s.type === 'text' && s.id.startsWith('shape:text_')
    );

    textShapes.forEach((textShape) => {
      const parentId = textShape.id.replace('shape:text_', '');
      const parentBounds = editorInstance.getShapePageBounds(parentId);
      const textBounds = editorInstance.getShapePageBounds(textShape.id);
      if (!parentBounds || !textBounds) return;

      editorInstance.updateShape({
        id: textShape.id,
        type: 'text',
        x: parentBounds.x + parentBounds.w / 2 - textBounds.w / 2,
        y: parentBounds.y + parentBounds.h / 2 - textBounds.h / 2,
      });
    });
  };

  
  const saveTasksDb = async () => {
  // Merge existing tasks with newly assigned ones
  const existingTasks = fetchTasks || [];
  const allTasks = [...existingTasks];

  saveTasks.forEach((newTask) => {
    const index = allTasks.findIndex((t) => t.member_id === newTask.member_id);
    if (index === -1) {
      allTasks.push(newTask); // add if not exists
    } else {
      // Optionally update existing task (or skip if you want to keep first assignment)
      allTasks[index] = newTask;
    }
  });

  // Upsert
  const { error: updateError, count } = await supabase
    .from('drawings')
    .update({ tasks: allTasks })
    .eq('project_id', projectId);

  if (updateError) {
    console.error('Update failed:', updateError.message);
    alert('Failed to save tasks');
    return;
  }

  if (count === 0) {
    const { error: insertError } = await supabase
      .from('drawings')
      .insert({ project_id: projectId, tasks: allTasks });

    if (insertError) {
      console.error('Insert failed:', insertError.message);
      alert('Failed to save tasks');
      return;
    }
  }

  alert('Task added successfully');
  await fetchTasksDb(); // refresh UI
  setSaveTasks([]); // clear pending tasks
  setAssignTask(false);
};


  const assignTaskFunction = (id) => {
  const user = communityMembers.find((person) => person.id === id);
  if (!user || !newTask) return;

  // Check if already assigned in DB
  const alreadyAssignedInDb = fetchTasks.some((task) => task.member_id === id);
  if (alreadyAssignedInDb) {
    alert(`${user.name} already has a task assigned.`);
    return;
  }

  // Check if already assigned in current session (unsaved)
  const alreadyAssignedLocally = saveTasks.some((item) => item.member_id === id);
  if (alreadyAssignedLocally) {
    alert(`${user.name} already has a task assigned (not saved yet).`);
    return;
  }

  const memberTask = {
    member_id: id,
    name: user.name,
    task: newTask,
  };

  setSaveTasks((prev) => [...prev, memberTask]);

  // ✅ Fix: use `id` not `member_id`
  setCommunityMembers((prevMembers) =>
    prevMembers.filter((item) => item.id !== id)
  );

  setNewTask('');
};


  const fetchTasksDb = useCallback(async () => {
    const { error, data } = await supabase
      .from('drawings')
      .select('tasks')
      .eq('project_id', projectId);
    
    if (!error && data[0]?.tasks) {
      setFetchTasks(data[0].tasks);
    } else {
      setFetchTasks([]); // ✅ ensure it's an array
    }
}, [projectId, supabase]);

useEffect(() => {
  fetchTasksDb();
}, [fetchTasksDb]);

  useEffect(() => {
    if (assignTask) {
      const fetchMembers = async () => {
        const { error, data } = await supabase
          .from("community_members")
          .select(`role, users(id, name, email, about, avatar_url)`)
          .eq('community_id', communityId);

        if (!error) {
          const formatted = data.map((row) => ({
            ...row.users,
            role: row.role
          }));
          // setCommunityMembers(formatted);
          
          const filteredCommunityMembers = formatted.filter(
            (member) => !fetchTasks.some(
              (task) => member.id === task.member_id)
          )
          // console.log(filteredCommunityMembers);
          setCommunityMembers(filteredCommunityMembers);
        }
        };
        if (communityId) fetchMembers();
    }
  }, [assignTask, communityId, supabase]);

  // useEffect(() => {
  //     const fetchCommunityMembers = async () => {
  //       const { error, data } = await supabase
  //         .from("community_members")
  //         .select(`role, users(id, name, email, about, avatar_url)`)
  //         .eq('community_id', communityId);
  
  //       if (error) {
  //         console.error("Community member fetch error: ", error.message);
  //         return;
  //       }
        
  //       const formattedMembers = data.map((row) => ({
  //         ...row.users,
  //         role: row.role
  //       }));
        
  //       setCommunityMembers(formattedMembers);
  //     };
  
  //     if (communityId) fetchCommunityMembers();
  //   }, [communityId, supabase]);

  // Load existing drawing from DB
  useEffect(() => {
    if (!editor || !projectId) return;

    const fetchDrawings = async () => {
      const { error, data } = await supabase
        .from('drawings')
        .select('*')
        .eq('project_id', projectId);

      if (error) {
        console.error('Fetch error:', error.message);
        return;
      }

      if (data[0]?.elements) {
        editor.run(() => {
          editor.createShapes(data[0].elements);
        });
        setTimeout(() => recenterTextShapes(editor), 100);
      }
    };

    fetchDrawings();
  }, [editor, projectId]);

  // Autosave listener
  useEffect(() => {
    if (!editor || !projectId) return;

    const cleanup = editor.store.listen(
      (event) => {
        if (event.source === 'user') {
          const shapes = editor.getCurrentPageShapes();
          saveDebouncedRef.current(shapes);
        }
      },
      { scope: 'document' }
    );

    return () => cleanup();
  }, [editor, projectId]);

  // AI generation handler
  const handleGenerateAI = async () => {
    if (!editor || !prompt) return;
    setIsGenerating(true);
    try {
      const shapes = editor.getCurrentPageShapes();
      const { data, error } = await supabase.functions.invoke('generate-canvas', {
        body: { prompt: prompt, currentCanvas: shapes },
      });

      if (error) {
        console.log('Error generating canvas', error.message);
        return;
      }

      const aiGenerateData = data;
      if (aiGenerateData?.shapes && Array.isArray(aiGenerateData.shapes)) {
        const extraTextShapes = [];
        const validateShapes = aiGenerateData.shapes.map((shape) => {
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
              w,
              h,
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
                    content: [
                      {
                        type: 'paragraph',
                        content: [{ type: 'text', text: shape.props.text }],
                      },
                    ],
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
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: shape.props?.text || ' ' }],
                  },
                ],
              },
              color: shape.props?.color || 'black',
              size: shape.props?.size || 'm',
              font: shape.props?.font || 'draw',
            };
          }
          return sanitized;
        });

        validateShapes.forEach((s) => {
          if (s.type === 'text') {
            delete s.props.align;
            delete s.props.verticalAlign;
            delete s.props.growY;
            delete s.props.w;
          }
        });

        if (validateShapes.length > 0) {
          editor.markHistoryStoppingPoint('ai-generation');
          const finalShapes = [...validateShapes, ...extraTextShapes];
          editor.createShapes(finalShapes);

          await saveDrawingToSupabase(finalShapes);

          setTimeout(() => {
            extraTextShapes.forEach((textShape) => {
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
      console.error('AI Generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-[#f5f5f7] overflow-hidden relative">
      {/* ===== MAIN CONTENT (BLURRED WHEN MODAL OPEN) ===== */}
      <div
        className={`h-full w-full flex transition-all duration-200 ${
          assignTask ? 'blur-sm pointer-events-none' : ''
        }`}
      >
        {/* Sidebar toggle button (when closed) */}
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

        {/* Left sidebar (AI panel) */}
        <AnimatePresence mode="wait">
          {isPanelOpen && (
            <motion.div
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: 'spring', stiffness: 200, damping: 25 }}
              className="w-80 h-full bg-white border-r border-gray-200 flex flex-col z-[110] shadow-2xl"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                    <Sparkles size={18} className="text-white" />
                  </div>
                  <h2 className="font-bold text-xl text-gray-900 tracking-tight">AI Draw</h2>
                  <div className="ml-2">
                    {isSaving ? (
                      <Loader2 size={16} className="animate-spin text-blue-500" />
                    ) : (
                      <Cloud size={16} className="text-gray-400" />
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setIsPanelOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ChevronLeft size={20} className="text-gray-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                {/* Generate Canvas section */}
                <section className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-black">
                    Generate Canvas
                  </label>
                  <div className="space-y-3">
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="E.g. Create a login page..."
                      className="w-full h-32 p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-black text-sm outline-none resize-none"
                    />
                    <button
                      onClick={handleGenerateAI}
                      disabled={isGenerating || !prompt}
                      className="w-full py-3 bg-black text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all"
                    >
                      {isGenerating ? (
                        <Loader2 className="animate-spin" size={18} />
                      ) : (
                        'Generate'
                      )}
                    </button>
                  </div>
                </section>

                {/* <hr className="border-gray-100" /> */}

                {/* Actions section */}
                <section className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Actions
                  </label>
                  <button
                    onClick={() => setAssignTask(true)}
                    className="w-full flex items-center justify-between p-4 bg-white border-2 border-black rounded-xl hover:bg-yellow-50 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[1px] active:translate-y-[1px]"
                  >
                    <span className="font-bold flex items-center gap-2 text-sm">
                      <CheckSquare size={18} /> Assign Task
                    </span>
                    <UserPlus size={18} />
                  </button>
                </section>

                <section className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Tasks Assigned
                  </label>

                  <ul
                    className="
                      space-y-3
                      max-h-64
                      overflow-y-auto
                      pr-1
                      custom-scrollbar
                    "
                  >
                    {fetchTasks.length === 0 ? (
                      <h1 className="text-sm text-gray-400 text-center py-8">
                        No task is assigned yet
                      </h1>
                    ) : (
                      <>
                        {fetchTasks.map((task) => (
                          <li
                            key={task.id}
                            className="
                              flex flex-col sm:flex-row
                              sm:items-center
                              sm:justify-between
                              gap-2 sm:gap-4
                              p-4
                              bg-white
                              border border-gray-200
                              rounded-2xl
                              shadow-sm
                              hover:shadow-md
                              hover:border-black
                              transition-all
                            "
                          >
                            <p className="text-sm font-bold text-gray-900 truncate">
                              {task.name}
                            </p>

                            <p className="
                              text-xs text-gray-600
                              bg-emerald-100
                              leading-relaxed
                              sm:text-right
                              break-words
                              sm:max-w-[60%]
                              p-1 rounded-md
                            ">
                              {task.task}
                            </p>
                          </li>
                        ))}
                      </>
                    )}
                  </ul>
                </section>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Canvas area */}
        <div className="flex-1 relative h-full">
          <Tldraw
            inferDarkMode={false}
            autoFocus
            onMount={(editorInstance) => setEditor(editorInstance)}
          />
        </div>
      </div>

      {/* ===== ASSIGN TASK MODAL ===== */}
      <AnimatePresence>
        {assignTask && (
          <>
            {/* Backdrop (optional – keeps modal overlay) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAssignTask(false)}
              className="fixed inset-0 bg-black/10 z-[200]"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-white border-2 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 z-[210]"
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                    <CheckSquare size={18} className="text-white" />
                  </div>
                  <h3 className="font-bold text-xl text-gray-900 tracking-tight">
                    Assign Task
                  </h3>
                </div>
                <button
                  onClick={() => setAssignTask(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ChevronLeft size={20} className="text-gray-500" />
                </button>
              </div>

              {/* Task input */}
              <div className="space-y-2 mb-6">
                <label className="text-[10px] font-black uppercase tracking-widest text-black">
                  Task description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Implement login page..."
                  className="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-black outline-none text-sm transition-colors"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                />
              </div>

              {/* Users list */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-black">
                  Assign to
                </label>
                <div className="max-h-64 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                  {communityMembers.length === 0 ? 
                  <p className='text-sm text-gray-400 text-center'>No member is left to assign</p>
                  :
                  <>
                    {communityMembers.map((person) => (
                    <div
                      key={person.id}
                      className="flex items-center justify-between p-3 bg-gray-50 border-2 border-gray-100 rounded-xl hover:border-black transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white border-2 rounded-full flex items-center justify-center">
                          {/* <span className="text-xs font-bold">
                            {person.avatar_url}
                          </span> */}
                          <img src={person.avatar_url} alt="" className='rounded-full'/>
                        </div>
                        <div>
                          <p className="font-bold text-sm">{person.name}</p>
                          <p className="text-xs text-gray-500">{person.role}</p>
                        </div>
                      </div>
                      <Button 
                      onClick={() => assignTaskFunction(person.id)}
                      className="px-4 py-1.5 bg-black text-white text-xs font-bold rounded-lg hover:opacity-90 active:scale-95 transition-all border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[1px] active:translate-y-[1px]">
                        Assign
                      </Button>
                    </div>
                  ))}
                  </>
                }
                </div>
              </div>

              {/* Footer actions */}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                <Button
                  onClick={() => setAssignTask(false)}
                  className="px-5 py-2 bg-white text-black border-2 border-black rounded-lg font-bold text-sm hover:bg-gray-50 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[1px] active:translate-y-[1px]"
                >
                  Cancel
                </Button>
                <Button 
                onClick={saveTasksDb}
                disabled={communityMembers.length === 0}
                className="px-5 py-2 bg-black text-white border-2 border-black rounded-lg font-bold text-sm hover:opacity-90 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[1px] active:translate-y-[1px]">
                  Create Task
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}