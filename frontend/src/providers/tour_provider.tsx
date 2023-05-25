import React, { useState } from 'react'
import { createContext } from 'react'

interface TourContextValue {
  isMainTourOpen: boolean
  mainTourStep: number
  isGraphTourOpen: boolean
  graphTourStep: number
  setIsMainTourOpen: React.Dispatch<React.SetStateAction<boolean>>
  setMainTourStep: React.Dispatch<React.SetStateAction<number>>
  setIsGraphTourOpen: React.Dispatch<React.SetStateAction<boolean>>
  setGraphTourStep: React.Dispatch<React.SetStateAction<number>>
}

export const TourContext = createContext<TourContextValue>({
  isMainTourOpen: false,
  mainTourStep: 0,
  isGraphTourOpen: false,
  graphTourStep: 0,
  setIsMainTourOpen: () => {},
  setMainTourStep: () => {},
  setIsGraphTourOpen: () => {},
  setGraphTourStep: () => {},
})

export const TourProvider = ({ children }) => {
  const [isMainTourOpen, setIsMainTourOpen] = useState(false)
  const [mainTourStep, setMainTourStep] = useState(0)
  const [isGraphTourOpen, setIsGraphTourOpen] = useState(false)
  const [graphTourStep, setGraphTourStep] = useState(0)

  return (
    <TourContext.Provider
      value={{
        isMainTourOpen,
        mainTourStep,
        isGraphTourOpen,
        graphTourStep,
        setIsMainTourOpen,
        setMainTourStep,
        setIsGraphTourOpen,
        setGraphTourStep,
      }}
    >
      {children}
    </TourContext.Provider>
  )
}
