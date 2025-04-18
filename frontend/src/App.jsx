import { Routes, Route } from 'react-router-dom'
//import Header from './components/Header'
import Home from './pages/Home'
import Header from './components/header'
//import Recipe from './pages/Recipe'
//import Auth from './pages/Auth'
//import CreateRecipe from './pages/CreateRecipe'

// <Route path="/recipe/:id" element={<Recipe />} />
//<Route path="/auth" element={<Auth />} />
//<Route path="/create" element={<CreateRecipe />} />

function App() {
  return (
    <div className="app">
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </main>
    </div>
  )
}

export default App