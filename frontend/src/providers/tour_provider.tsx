import React, { useState } from 'react'
import { createContext } from 'react'

interface TourContextValue {
  isMainTourOpen: boolean
  isGraphTourOpen: boolean
  isRequestTourOpen: boolean
  isMapTourOpen: boolean
  mainTourStep: number
  graphTourStep: number
  setIsMainTourOpen: React.Dispatch<React.SetStateAction<boolean>>
  setIsGraphTourOpen: React.Dispatch<React.SetStateAction<boolean>>
  setIsRequestTourOpen: React.Dispatch<React.SetStateAction<boolean>>
  setIsMapTourOpen: React.Dispatch<React.SetStateAction<boolean>>
  setMainTourStep: React.Dispatch<React.SetStateAction<number>>
  setGraphTourStep: React.Dispatch<React.SetStateAction<number>>
}

export const TourContext = createContext<TourContextValue>({
  isMainTourOpen: false,
  isGraphTourOpen: false,
  isRequestTourOpen: false,
  isMapTourOpen: false,
  mainTourStep: 0,
  graphTourStep: 0,
  setIsMainTourOpen: () => {},
  setIsGraphTourOpen: () => {},
  setIsRequestTourOpen: () => {},
  setIsMapTourOpen: () => {},
  setMainTourStep: () => {},
  setGraphTourStep: () => {},
})

export const TourProvider = ({ children }) => {
  const [isMainTourOpen, setIsMainTourOpen] = useState(false)
  const [isGraphTourOpen, setIsGraphTourOpen] = useState(false)
  const [isRequestTourOpen, setIsRequestTourOpen] = useState(false)
  const [isMapTourOpen, setIsMapTourOpen] = useState(false)
  const [mainTourStep, setMainTourStep] = useState(0)
  const [graphTourStep, setGraphTourStep] = useState(0)

  return (
    <TourContext.Provider
      value={{
        isMainTourOpen,
        isGraphTourOpen,
        isRequestTourOpen,
        isMapTourOpen,
        mainTourStep,
        graphTourStep,
        setIsMainTourOpen,
        setIsGraphTourOpen,
        setIsRequestTourOpen,
        setIsMapTourOpen,
        setMainTourStep,
        setGraphTourStep,
      }}
    >
      {children}
    </TourContext.Provider>
  )
}
