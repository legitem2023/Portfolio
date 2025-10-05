'use client'
import Marquee from 'components/UI/Marquee';
import AdDropdown from './AdDropdown';
const Ads:React.FC = () => {

  const Dropdown = (<Marquee text="Spotted! The perfect place for your products call now 09153392813" fontSize="35px" speed={10} />)
  return (
     <AdDropdown content={Dropdown}/>
  )
}

export default Ads
