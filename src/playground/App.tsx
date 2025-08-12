import * as React from 'react';
import Editor from '../components/editor/Editor';

function App() {
  const [editMode, setEditMode] = React.useState(false);
  const [showHeader, setShowHeader] = React.useState(false);
  const [showFooter, setShowFooter] = React.useState(false);

  return (
    <div style={{ minHeight: '100vh', background: '#f4f4f4' }}>
      <Editor
        showHeader={showHeader}
        setShowHeader={setShowHeader}
        showFooter={showFooter}
        setShowFooter={setShowFooter}
        editMode={editMode}
        setEditMode={setEditMode}
      />
    </div>
  );
}

export default App;
