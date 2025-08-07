import * as React from 'react';
import './App.css';
import { Editor } from 'src/components';

function App(): JSX.Element {
  const [wordCount, setWordCount] = React.useState(0);
  const [charCount, setCharCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    // Simüle loading sürecini
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => {
      clearTimeout(timer);
    };
  }, []);

  const handleWordCountChange = React.useCallback((words: number, chars: number) => {
    setWordCount(words);
    setCharCount(chars);
  }, []);

  if (isLoading) {
    return (
      <div className="App">
        <div className="editorLoading">Editör yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="App">
      <header>
        <h1 className="editorHeading">Editor</h1>
      </header>

      <main className="editorWrapper">
        <Editor onWordCountChange={handleWordCountChange} />
      </main>
      <footer className="editorStatusBar">
        <div className="statusBarLeft">
          <span>Sayfa 1 / 1</span>
          <span>Kelime: {wordCount}</span>
          <span>Karakter: {charCount}</span>
        </div>
        <div className="statusBarRight">
          <span>Türkçe (Türkiye)</span>
          <span>100%</span>
        </div>
        <div className="statusBarDebug">
          <span>kayblound wordocunt: {wordCount}</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
