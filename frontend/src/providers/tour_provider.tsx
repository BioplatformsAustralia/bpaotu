import React, { useState } from 'react'
import { createContext } from 'react'

interface TourContextValue {
  tourMode: boolean
  isMainTourOpen: boolean
  isGraphTourOpen: boolean
  isRequestTourOpen: boolean
  isMapTourOpen: boolean
  isShortGraphTourOpen: boolean
  mainTourStep: number
  graphTourStep: number
  setTourMode: React.Dispatch<React.SetStateAction<boolean>>
  setIsMainTourOpen: React.Dispatch<React.SetStateAction<boolean>>
  setIsGraphTourOpen: React.Dispatch<React.SetStateAction<boolean>>
  setIsRequestTourOpen: React.Dispatch<React.SetStateAction<boolean>>
  setIsMapTourOpen: React.Dispatch<React.SetStateAction<boolean>>
  setIsShortGraphTourOpen: React.Dispatch<React.SetStateAction<boolean>>
  setMainTourStep: React.Dispatch<React.SetStateAction<number>>
  setGraphTourStep: React.Dispatch<React.SetStateAction<number>>
}

export const TourContext = createContext<TourContextValue>({
  tourMode: false,
  isMainTourOpen: false,
  isGraphTourOpen: false,
  isRequestTourOpen: false,
  isMapTourOpen: false,
  isShortGraphTourOpen: false,
  mainTourStep: 0,
  graphTourStep: 0,
  setTourMode: () => {},
  setIsMainTourOpen: () => {},
  setIsGraphTourOpen: () => {},
  setIsRequestTourOpen: () => {},
  setIsMapTourOpen: () => {},
  setIsShortGraphTourOpen: () => {},
  setMainTourStep: () => {},
  setGraphTourStep: () => {},
})

export const TourProvider = ({ children }) => {
  const [tourMode, setTourMode] = useState(false)
  const [isMainTourOpen, setIsMainTourOpen] = useState(false)
  const [isGraphTourOpen, setIsGraphTourOpen] = useState(false)
  const [isRequestTourOpen, setIsRequestTourOpen] = useState(false)
  const [isMapTourOpen, setIsMapTourOpen] = useState(false)
  const [isShortGraphTourOpen, setIsShortGraphTourOpen] = useState(false)
  const [mainTourStep, setMainTourStep] = useState(0)
  const [graphTourStep, setGraphTourStep] = useState(0)

  return (
    <TourContext.Provider
      value={{
        tourMode,
        setTourMode,
        isMainTourOpen,
        isGraphTourOpen,
        isRequestTourOpen,
        isMapTourOpen,
        isShortGraphTourOpen,
        mainTourStep,
        graphTourStep,
        setIsMainTourOpen,
        setIsGraphTourOpen,
        setIsRequestTourOpen,
        setIsMapTourOpen,
        setIsShortGraphTourOpen,
        setMainTourStep,
        setGraphTourStep,
      }}
    >
      {children}
    </TourContext.Provider>
  )
}
