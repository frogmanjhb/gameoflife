import React from 'react';

/** Constrains teacher tool panels inside mobile sheets — prevents horizontal overflow. */
const TeacherToolContentShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-w-0 w-full max-w-full overflow-x-hidden space-y-4 [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto">
    {children}
  </div>
);

export default TeacherToolContentShell;
