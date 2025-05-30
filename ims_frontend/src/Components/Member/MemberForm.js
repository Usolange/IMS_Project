// MemberForm.js
export default function MemberForm({ member, setMember, handleSubmit, editMode }) {
  return (
    <form onSubmit={handleSubmit} className="member-form">
      <input
        type="text"
        placeholder="Enter name"
        value={member.name}
        onChange={(e) => setMember({ ...member, name: e.target.value })}
        required
      />
      <input
        type="email"
        placeholder="Enter email"
        value={member.email}
        onChange={(e) => setMember({ ...member, email: e.target.value })}
        required
      />
      <input
        type="text"
        placeholder="Enter status"
        value={member.status}
        onChange={(e) => setMember({ ...member, status: e.target.value })}
        required
      />
      <button type="submit">{editMode ? 'Update Member' : 'Add Member'}</button>
    </form>
  );
}
