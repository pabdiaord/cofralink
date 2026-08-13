import Sidebar from './Sidebar'

export default function Layout({ children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#efe3d7' }}>
      <Sidebar />
      <main style={{
        marginLeft: '220px',
        flex: 1,
        minHeight: '100vh',
        backgroundColor: '#efe3d7',
        overflowY: 'auto',
      }}>
        {children}
      </main>
    </div>
  )
}