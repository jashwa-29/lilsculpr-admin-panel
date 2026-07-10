import React from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export const Layout = ({ children, title }) => {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar title={title} />
        <main className="flex-1 overflow-y-auto p-6 bg-[#f8f7ff]"> 
          {children}
        </main>
      </div>
    </div>
  );
};
