import Sidebar from './Sidebar'

export default function Layout({ children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f5f0e8' }}>
      <Sidebar />
      <main style={{
        marginLeft: '220px',
        flex: 1,
        minHeight: '100vh',
        backgroundColor: '#f5f0e8',
        overflowY: 'auto',
      }}>
        {children}
      </main>
    </div>
  )
}