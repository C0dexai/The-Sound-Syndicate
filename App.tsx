
import React, { useState, useCallback, useEffect } from 'react';
import { Task, Status, Priority, Message, WorkflowStep } from './types';
import TaskModal from './components/TaskModal';
import Header from './components/Header';
import { getAiResponse, generateWorkflowArtifact } from './services/geminiService';
import PreviewPage from './components/PreviewPage';
import SettingsModal from './components/SettingsModal';
import { SYSTEM_INSTRUCTION_BASE } from './constants';
import { agents, getAgent, Agent } from './agents';
import StartPage from './components/StartPage';
import InferencePage from './components/InferencePage';
import WorkflowPage from './components/WorkflowPage';
import ArtifactModal from './components/ArtifactModal';
import SoundNodeLab from './components/VoicePage';
import { getTasksDB, getMessagesDB, saveTaskDB, saveTasksDB, saveMessageDB } from './services/dbService';
import FloatingNav from './components/FloatingNav';
import OrchestrationPage from './components/OrchestrationPage';
import PromptDJPage from './components/PromptDJPage';
import DJMixerPage from './components/DJMixerPage';

export type ViewType = 'dj' | 'inference' | 'workflow' | 'voice' | 'orchestration' | 'promptdj';

const INITIAL_WORKFLOW_STEPS: WorkflowStep[] = [
  {
    name: "Acoustic Blueprint",
    agentName: "Adam",
    status: 'pending',
    artifactName: '_layout_plan.md',
    description: "Adam drafts an initial room layout and acoustic treatment plan based on the user's goal."
  },
  {
    name: "Frequency Analysis",
    agentName: "David",
    status: 'pending',
    artifactName: '_analysis.json',
    description: "David calculates the estimated RT60 and identifies potential modal issues from the blueprint."
  },
  {
    name: "OSHA Compliance Checklist",
    agentName: "Charlie",
    status: 'pending',
    artifactName: '_osha_checklist.md',
    description: "Charlie generates a safety and compliance checklist for the proposed studio environment."
  }
];

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isDbLoading, setIsDbLoading] = useState(true);

  const [hasEntered, setHasEntered] = useState<boolean>(() => {
    return localStorage.getItem('crucible-has-entered') === 'true';
  });

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentView, setCurrentView] = useState<ViewType>('dj'); // Default to the new DJ Mixer
  const [selectedAgentName, setSelectedAgentName] = useState<string>(() => {
    return localStorage.getItem('crucible-agent-name') || 'Andoy';
  });
  
  // State for the new Workflow feature
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>(INITIAL_WORKFLOW_STEPS);
  const [isWorkflowRunning, setIsWorkflowRunning] = useState(false);
  const [viewedArtifact, setViewedArtifact] = useState<WorkflowStep | null>(null);

  const isPreviewMode = new URLSearchParams(window.location.search).get('view') === 'preview';
  
  useEffect(() => {
    const loadData = async () => {
        try {
            const [dbTasks, dbMessages] = await Promise.all([
                getTasksDB(),
                getMessagesDB(),
            ]);
            setTasks(dbTasks || []);
            setMessages(dbMessages || []);
        } catch (error) {
            console.error("Failed to load data from IndexedDB", error);
        } finally {
            setIsDbLoading(false);
        }
    };
    if (hasEntered) {
        loadData();
    } else {
        setIsDbLoading(false);
    }
  }, [hasEntered]);

  useEffect(() => {
    localStorage.setItem('crucible-agent-name', selectedAgentName);
  }, [selectedAgentName]);
  
  const handleEnter = () => {
    localStorage.setItem('crucible-has-entered', 'true');
    setHasEntered(true);
  };

  const handleUpdateTask = useCallback(async (updatedTask: Task) => {
    await saveTaskDB(updatedTask);
    setTasks(prevTasks => prevTasks.map(task => (task.id === updatedTask.id ? updatedTask : task)));
  }, []);

  const handleCommand = useCallback(async (prompt: string): Promise<void> => {
    if (!prompt) return;

    setIsLoading(true);
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      sender: 'USER',
      text: prompt,
      timestamp: new Date().toISOString(),
    };
    
    await saveMessageDB(userMessage);
    
    let conversation;
    setMessages(prev => {
        conversation = [...prev, userMessage];
        return conversation;
    });
    
    const agent = getAgent(selectedAgentName) || getAgent('Andoy')!;
    const systemInstruction = `${agent.personality_prompt}\n\n${SYSTEM_INSTRUCTION_BASE}`;

    const aiResponse = await getAiResponse(prompt, conversation!, tasks, systemInstruction);

    if (aiResponse) {
      const aiMessage: Message = {
        id: `msg-${Date.now()}-ai`,
        sender: aiResponse.speaker,
        text: aiResponse.reply,
        timestamp: new Date().toISOString(),
      };
      await saveMessageDB(aiMessage);
      setMessages(prev => [...prev, aiMessage]);

      if (aiResponse.action) {
        switch (aiResponse.action.type) {
          case 'CREATE_TASKS':
            if (Array.isArray(aiResponse.action.payload)) {
              const newTasks: Task[] = aiResponse.action.payload.map((taskData: any) => ({
                id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                title: taskData.title,
                description: taskData.description,
                status: Status.Backlog,
                priority: Priority.None,
              }));
              await saveTasksDB(newTasks);
              setTasks(prev => [...prev, ...newTasks]);
            }
            break;

          case 'UPDATE_TASK':
            if (aiResponse.action.payload && typeof aiResponse.action.payload === 'object' && aiResponse.action.payload.id) {
              const { id, ...updates } = aiResponse.action.payload;
              
              if (updates.critique) {
                updates.critique = `${aiResponse.speaker}: ${updates.critique}`;
              }

              const taskToUpdate = tasks.find(t => t.id === id);
              if (taskToUpdate) {
                const updatedTask = { ...taskToUpdate, ...updates };
                await handleUpdateTask(updatedTask);
                if (selectedTask?.id === id) {
                  setSelectedTask(updatedTask);
                }
              }
            }
            break;
        }
      }
    }
    setIsLoading(false);
  }, [tasks, selectedAgentName, handleUpdateTask, selectedTask]);

  const handleCritiqueTask = useCallback(async (taskToCritique: Task) => {
    const command = `Critique the task with ID "${taskToCritique.id}". The title is: "${taskToCritique.title}"`;
    await handleCommand(command);
  }, [handleCommand]);

  const handleStartWorkflow = useCallback(async (goal: string) => {
    if (!goal.trim() || isWorkflowRunning) return;

    setIsWorkflowRunning(true);
    setWorkflowSteps(INITIAL_WORKFLOW_STEPS);

    const updateStep = (stepIndex: number, updates: Partial<WorkflowStep>) => {
        setWorkflowSteps(prev => {
            const newSteps = [...prev];
            newSteps[stepIndex] = { ...newSteps[stepIndex], ...updates };
            return newSteps;
        });
    };

    const runStep = async (stepIndex: number, prompt: string, agent: Agent, isJson: boolean = false): Promise<string | null> => {
        updateStep(stepIndex, { status: 'running' });
        try {
            const artifactContent = await generateWorkflowArtifact(agent.personality_prompt, prompt, isJson);
            updateStep(stepIndex, { status: 'complete', artifactContent });
            return artifactContent;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            console.error(`Error in workflow step ${stepIndex + 1} (${agent.name}):`, error);
            updateStep(stepIndex, { status: 'error', error: errorMessage });
            return null;
        }
    };

    // Step 1: Adam
    const adam = getAgent('Adam')!;
    const adamPrompt = `Using markdown, draft an initial room layout and acoustic treatment plan for the following goal:\n\n"${goal}"\n\nInclude sections for speaker placement, listening position, and recommendations for bass traps and absorption panels.`;
    const layoutPlan = await runStep(0, adamPrompt, adam);
    if (!layoutPlan) {
        setIsWorkflowRunning(false);
        return;
    }
    
    // Step 2: David
    const david = getAgent('David')!;
    const davidPrompt = `Analyze the following acoustic plan and provide key metrics. The entire response must be a single, valid JSON object and nothing else. Calculate estimated RT60, and identify the top 3 potential modal frequencies based on common room dimensions implied by the goal.\n\nAcoustic Plan:\n\`\`\`markdown\n${layoutPlan}\n\`\`\``;
    const analysisJson = await runStep(1, davidPrompt, david, true);
    if (!analysisJson) {
        setIsWorkflowRunning(false);
        return;
    }

    // Step 3: Charlie
    const charlie = getAgent('Charlie')!;
    const charliePrompt = `Based on the goal "${goal}" and the following acoustic plan, generate a concise OSHA compliance and general safety checklist in markdown format. Focus on noise exposure, electrical safety, and ergonomics.\n\nAcoustic Plan:\n\`\`\`markdown\n${layoutPlan}\n\`\`\``;
    await runStep(2, charliePrompt, charlie);

    setIsWorkflowRunning(false);
  }, [isWorkflowRunning]);


  const handleOpenModal = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedTask(null);
    setIsModalOpen(false);
  };

  if (isPreviewMode) {
    return <PreviewPage />;
  }
  
  if (!hasEntered) {
    return <StartPage onEnter={handleEnter} />;
  }

  if (isDbLoading) {
    return (
      <div className="min-h-screen dark-bg text-gray-100 flex items-center justify-center">
        <div className="text-center animate-pulse">
            <h1 className="text-4xl font-bold tracking-tighter neon-text-cyan mb-2">The Crucible</h1>
            <p className="neon-text-pink">Loading Audio Environment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen dark-bg text-gray-100 flex flex-col h-screen">
      <Header 
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
      <main className="flex-grow flex flex-col overflow-hidden p-4 sm:p-6 lg:p-8">
        {currentView === 'dj' && (
           <DJMixerPage />
        )}
        {currentView === 'inference' && (
          <InferencePage 
            agents={agents}
            selectedAgentName={selectedAgentName}
            setSelectedAgentName={setSelectedAgentName}
            messages={messages}
            onCommand={handleCommand}
            isLoading={isLoading}
          />
        )}
        {currentView === 'workflow' && (
          <WorkflowPage
            steps={workflowSteps}
            isRunning={isWorkflowRunning}
            onStart={handleStartWorkflow}
            onViewArtifact={setViewedArtifact}
          />
        )}
        {currentView === 'voice' && (
          <SoundNodeLab />
        )}
        {currentView === 'orchestration' && (
          <OrchestrationPage />
        )}
        {currentView === 'promptdj' && (
          <PromptDJPage />
        )}
      </main>
      
      {isModalOpen && selectedTask && (
        <TaskModal
          task={selectedTask}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onUpdate={handleUpdateTask}
          onCritique={handleCritiqueTask}
        />
      )}
      
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentAgentName={selectedAgentName}
        onSave={setSelectedAgentName}
      />

      {viewedArtifact && (
        <ArtifactModal
          artifact={viewedArtifact}
          onClose={() => setViewedArtifact(null)}
        />
      )}
      <FloatingNav setCurrentView={setCurrentView} />
    </div>
  );
};

export default App;
