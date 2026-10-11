import { storeAssistantConfig } from '../../../config/storeAssistant'
import { Icon } from '../Icon'
export function AssistantAvatar() {
  const { avatar, commercialAvatarApproved } = storeAssistantConfig
  return (
    <span className="sf-assistant-avatar" aria-hidden="true">
      {avatar.src && commercialAvatarApproved ? (
        <img src={avatar.src} alt="" width="48" height="48" />
      ) : (
        <Icon name="helmet" width="28" height="28" />
      )}
    </span>
  )
}
