import * as React from 'react';
import Editor from '../components/editor/Editor';

function App() {
  const [editMode, setEditMode] = React.useState(false);
  const [showHeader, setShowHeader] = React.useState(false);
  const [showFooter, setShowFooter] = React.useState(false);

  return (
      <Editor
        showHeader={showHeader}
        setShowHeader={setShowHeader}
        showFooter={showFooter}
        setShowFooter={setShowFooter}
        editMode={editMode}
        setEditMode={setEditMode}
      />
  );
}

export default App;
