import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Header from './components/header'
import UserProfile from './pages/UserProfile/UserProfile'
import RecipePage from './pages/Recipe/RecipePage'
import CreateRecipe from './pages/CreateRecipe/CreateRecipe'


function App() {
  return (
    <div className="app">
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/recipe/create" element={<CreateRecipe />} />
          <Route path="/recipe/:recipe_id" element={<RecipePage />} />
          <Route path="/user/:user_id" element={<UserProfile />} />
          <Route path="/" element={<Home />} />
        </Routes>
      </main>
    </div>
  )
}

export default App