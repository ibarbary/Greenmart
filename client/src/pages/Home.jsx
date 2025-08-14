import BottomBanner from "../components/BottomBanner"
import Categories from "../components/Categories"
import MainBanner from "../components/MainBanner"
import NewsLetter from "../components/NewsLetter"

function Home() {
  return (
    <div className="mt-10">
        <MainBanner/>
        <Categories/>
        <BottomBanner/>
        <NewsLetter/>
    </div>
  )
}
export default Home