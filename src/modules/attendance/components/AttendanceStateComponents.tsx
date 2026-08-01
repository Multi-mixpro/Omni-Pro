export function LoadingState({ message = 'Memuat...' }: { message?: string }) {
  return (
    <div style={{ padding: '40px 20px', textAlign: 'center', color: '#667085', fontSize: 14 }}>
      <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
      <div>{message}</div>
    </div>
  );
}

export function EmptyState({ title, message, icon = '📭' }: { title: string; message: string; icon?: string }) {
  return (
    <div style={{ padding: '40px 20px', textAlign: 'center', backgroundColor: '#18212F', border: '1px solid #18212F', borderRadius: 12, color: '#667085' }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: '#E4E7EC' }}>{title}</div>
      <div style={{ fontSize: 12, marginTop: 4, color: '#667085' }}>{message}</div>
    </div>
  );
}
