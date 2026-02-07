'use client'

import { useState, useEffect } from 'react'
import { UploadForm } from "@/components/upload-form"
import { WorkflowStatus } from "@/components/workflow-status"
import { DownloadButton } from "@/components/download-button"
import { RotateCcw, ShieldCheck, FileUp, Sparkles, CheckCircle2, AlertCircle, Moon, Sun, Lock, History, Trash2 } from "lucide-react"

type AppState = 'IDLE' | 'UPLOADING' | 'MONITORING' | 'COMPLETED' | 'FAILED';

export default function Home() {
  const [appState, setAppState] = useState<AppState>('IDLE');
  const [fileName, setFileName] = useState<string>('');
  const [commitSha, setCommitSha] = useState<string>('');
  const [runId, setRunId] = useState<number | null>(null);
  const [artifacts, setArtifacts] = useState<{ id: number; name: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Use environment variable for workflow file name, default to convert.yml
  const WORKFLOW_FILE = process.env.NEXT_PUBLIC_GITHUB_WORKFLOW_FILE || 'convert.yml';

  useEffect(() => {
    // Check local storage or system preference on mount
    const isDark = localStorage.getItem('theme') === 'dark' ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);

    setIsDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);

    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleUploadStart = () => {
    setAppState('UPLOADING');
    setError(null);
  };

  const handleUploadSuccess = (name: string, sha: string) => {
    setFileName(name);
    setCommitSha(sha);
    setAppState('MONITORING');
  };

  const handleUploadError = (msg: string) => {
    setError(msg);
    setAppState('FAILED');
  };

  const handleConversionComplete = (id: number, arts: { id: number; name: string }[]) => {
    setRunId(id);
    setArtifacts(arts);
    setAppState('COMPLETED');
  };

  const handleConversionError = (msg: string) => {
    setError(msg);
    setAppState('FAILED');
  };

  const handleReset = () => {
    setAppState('IDLE');
    setFileName('');
    setCommitSha('');
    setRunId(null);
    setArtifacts([]);
    setError(null);
  };

  return (
    <div className="container">
      {/* Header */}
      <header className="header">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div className="header-title">
            <Sparkles className="text-secondary" />
            <span className="gradient-text">File Converter</span>
          </div>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginLeft: '2.5rem', opacity: 0.9 }}>
            Py to Exe
          </span>
        </div>
        <button className="theme-toggle" onClick={toggleTheme}>
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </header>

      {/* Main Card */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            {appState === 'IDLE' && "Upload & Convert"}
            {appState === 'UPLOADING' && "Uploading File..."}
            {appState === 'MONITORING' && "Processing File..."}
            {appState === 'COMPLETED' && "Conversion Complete"}
            {appState === 'FAILED' && "Something Went Wrong"}
          </h2>
          <p className="card-subtitle">
            {appState === 'IDLE' && "Securely convert your files using GitHub Actions"}
            {appState === 'UPLOADING' && "Please wait while we upload your file"}
            {appState === 'MONITORING' && `Converting ${fileName} - this may take a moment`}
            {appState === 'COMPLETED' && "Download your converted files below"}
            {appState === 'FAILED' && "Please try again or check your connection"}
          </p>
        </div>

        {/* Dynamic Content */}
        {appState === 'IDLE' && (
          <UploadForm
            onUploadStart={handleUploadStart}
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
          />
        )}

        {(appState === 'UPLOADING' || appState === 'MONITORING') && (
          <div className="progress-container" style={{ display: 'block' }}>
            <div className="progress-labels">
              <span>{appState === 'UPLOADING' ? 'Uploading...' : 'Converting...'}</span>
              <span>{appState === 'UPLOADING' ? '20%' : 'In Progress'}</span>
            </div>
            {appState === 'MONITORING' ? (
              <WorkflowStatus
                workflowFileName={WORKFLOW_FILE}
                commitSha={commitSha}
                onComplete={handleConversionComplete}
                onError={handleConversionError}
              />
            ) : (
              <div className="progress-track">
                <div className="progress-fill" style={{ width: '20%' }}></div>
              </div>
            )}
          </div>
        )}

        {appState === 'COMPLETED' && (
          <div>
            <div className="status-message status-success">
              <CheckCircle2 size={24} />
              <div>
                <strong>Success!</strong> Your files are ready.
              </div>
            </div>
            <div className="space-y-2">
              {artifacts.map(artifact => (
                <div key={artifact.id} style={{ marginBottom: '10px' }}>
                  {/* Reusing existing DownloadButton but wrapping it might be needed for full style match
                                 For now, we let DownloadButton use its internal shadcn button, 
                                 or we could rewrite it. Given the CSS, let's just make sure it looks okay.
                                 Ideally we should pass a className to DownloadButton or wrap it on a div with .btn logic
                             */}
                  <DownloadButton artifactId={artifact.id} fileName={fileName} />
                </div>
              ))}
            </div>
          </div>
        )}

        {appState === 'FAILED' && (
          <div className="status-message status-error" style={{ display: 'flex' }}>
            <AlertCircle size={24} />
            <div>
              <strong>Error:</strong> {error || "Unknown error occurred."}
            </div>
          </div>
        )}

        {/* Reset Action */}
        {appState !== 'IDLE' && appState !== 'UPLOADING' && (
          <button className="btn btn-outline" onClick={handleReset}>
            <RotateCcw size={18} />
            Convert File
          </button>
        )}

      </div>

      {/* Features Grid */}
      <div className="features-grid">
        <div className="feature-item">
          <div className="feature-icon"><Lock size={32} /></div>
          <h3 className="feature-title">Secure & Private</h3>
          <p className="feature-desc">Files uploaded to private repository</p>
        </div>
        <div className="feature-item">
          <div className="feature-icon"><Trash2 size={32} /></div>
          <h3 className="feature-title">Auto Deletion</h3>
          <p className="feature-desc">Source files deleted after processing</p>
        </div>
        <div className="feature-item">
          <div className="feature-icon"><History size={32} /></div>
          <h3 className="feature-title">24h Retention</h3>
          <p className="feature-desc">Artifacts available for 24 hours</p>
        </div>
      </div>

      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} py to exe by nsn</p>
      </footer>
    </div>
  )
}
