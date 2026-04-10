'use client'

import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { useStore } from "@/lib/store"
import { useModal } from "@/components/ui/modal-provider"
import { Share } from "lucide-react"
import { PartnerDashboardModal } from "./partner-dashboard-modal"

export function PartnerDashboardTrigger() {
  const auth = useStore.use.auth()
  const { openModal, closeModal } = useModal()

  const handleClick = async () => {
    
    let modalId: string
    
    const closeHandler = () => {
      if (modalId) closeModal(modalId)
    }
    
    modalId = openModal({
      content: <PartnerDashboardModal onCloseModal={closeHandler} />,
      size: 'md',
      className: 'bg-gray-900 border border-gray-700'
    })
  }

  return (
    <DropdownMenuItem
      onClick={handleClick}
      className="text-gray-300 focus:bg-gray-700 py-3"
    >
      <Share className="w-5 h-5 mr-3" />
      <div className="flex flex-col">
        <span className="text-base">Partner Dashboard</span>
        <span className="text-xs text-gray-400">
          Manage your partner account and earnings
        </span>
      </div>
    </DropdownMenuItem>
  )
}