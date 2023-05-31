import React, { useState } from 'react'
import { createContext } from 'react'

interface TourContextValue {
  tourMode: boolean
  isMainTourOpen: boolean
  isGraphTourOpen: boolean
  isRequestSubtourOpen: boolean
  isMapSubtourOpen: boolean
  isGraphSubtourOpen: boolean
  mainTourStep: number
  graphTourStep: number
  setTourMode: React.Dispatch<React.SetStateAction<boolean>>
  setIsMainTourOpen: React.Dispatch<React.SetStateAction<boolean>>
  setIsGraphTourOpen: React.Dispatch<React.SetStateAction<boolean>>
  setIsRequestSubtourOpen: React.Dispatch<React.SetStateAction<boolean>>
  setIsMapSubtourOpen: React.Dispatch<React.SetStateAction<boolean>>
  setIsGraphSubtourOpen: React.Dispatch<React.SetStateAction<boolean>>
  setMainTourStep: React.Dispatch<React.SetStateAction<number>>
  setGraphTourStep: React.Dispatch<React.SetStateAction<number>>
}

export const TourContext = createContext<TourContextValue>({
  tourMode: false,
  isMainTourOpen: false,
  isGraphTourOpen: false,
  isRequestSubtourOpen: false,
  isMapSubtourOpen: false,
  isGraphSubtourOpen: false,
  mainTourStep: 0,
  graphTourStep: 0,
  setTourMode: () => {},
  setIsMainTourOpen: () => {},
  setIsGraphTourOpen: () => {},
  setIsRequestSubtourOpen: () => {},
  setIsMapSubtourOpen: () => {},
  setIsGraphSubtourOpen: () => {},
  setMainTourStep: () => {},
  setGraphTourStep: () => {},
})

export const TourProvider = ({ children }) => {
  const [tourMode, setTourMode] = useState(false)
  const [isMainTourOpen, setIsMainTourOpen] = useState(false)
  const [isGraphTourOpen, setIsGraphTourOpen] = useState(false)
  const [isRequestSubtourOpen, setIsRequestSubtourOpen] = useState(false)
  const [isMapSubtourOpen, setIsMapSubtourOpen] = useState(false)
  const [isGraphSubtourOpen, setIsGraphSubtourOpen] = useState(false)
  const [mainTourStep, setMainTourStep] = useState(0)
  const [graphTourStep, setGraphTourStep] = useState(0)

  return (
    <TourContext.Provider
      value={{
        tourMode,
        setTourMode,
        isMainTourOpen,
        isGraphTourOpen,
        isRequestSubtourOpen,
        isMapSubtourOpen,
        isGraphSubtourOpen,
        mainTourStep,
        graphTourStep,
        setIsMainTourOpen,
        setIsGraphTourOpen,
        setIsRequestSubtourOpen,
        setIsMapSubtourOpen,
        setIsGraphSubtourOpen,
        setMainTourStep,
        setGraphTourStep,
      }}
    >
      {children}
    </TourContext.Provider>
  )
}
