import React from 'react';

export const Table = ({ columns, data, renderRow, isLoading, emptyMessage }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px] text-sm">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-4 py-3 text-left font-bold text-xs uppercase tracking-wider text-muted border-b border-border"
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="text-center text-muted py-10">
                <div className="flex justify-center">
                  <div className="w-7 h-7 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              </td>
            </tr>
          ) : data.length > 0 ? (
            data.map(renderRow)
          ) : (
            <tr>
              <td colSpan={columns.length} className="text-center text-muted py-10 text-sm">
                {emptyMessage || 'No data available'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
