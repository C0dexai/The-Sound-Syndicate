
import React, { useMemo } from 'react';
import { WorkflowStep } from '../types';

interface ArtifactModalProps {
  artifact: WorkflowStep;
  onClose: () => void;
}

const ArtifactModal: React.FC<ArtifactModalProps> = ({ artifact, onClose }) => {

  const isJson = artifact.artifactName.endsWith('.json');
  
  const formattedContent = useMemo(() => {
    if (isJson && artifact.artifactContent) {
      try {
        const parsed = JSON.parse(artifact.artifactContent);
        return JSON.stringify(parsed, null, 2);
      } catch (e) {
        return artifact.artifactContent; // Return as is if parsing fails
      }
    }
    return artifact.artifactContent || 'No content available.';
  }, [artifact.artifactContent, isJson]);


  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="card-bg border border-neon-purple/50 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-neon-purple/30 flex-shrink-0 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold neon-text-cyan">{artifact.name}</h2>
            <p className="text-sm text-neon-pink font-mono">{artifact.artifactName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>

        <div className="p-4 flex-grow overflow-y-auto bg-slate-900/50">
          <pre className="text-sm text-gray-200 whitespace-pre-wrap font-sans">
            <code>
              {formattedContent}
            </code>
          </pre>
        </div>

        <div className="p-3 bg-slate-950/50 border-t border-neon-purple/30 flex justify-end gap-4 flex-shrink-0">
          <button onClick={onClose} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-md transition hover:shadow-[0_0_10px_var(--neon-cyan)]">Close</button>
        </div>
      </div>
    </div>
  );
};

export default ArtifactModal;
