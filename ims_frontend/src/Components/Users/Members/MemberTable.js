import React from 'react';

export default function MemberTable({ members, handleOpenEdit, handleDeleteMember }) {
  return (
    <table className="members-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {members.map(member => (
          <tr key={member.id}>
            <td>{member.name}</td>
            <td>{member.email}</td>
            <td>{member.status}</td>
            <td>
              <button onClick={() => handleOpenEdit(member)} className="edit-button">Edit</button>
              <button onClick={() => handleDeleteMember(member.id)} className="delete-button">Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
