import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { Dialog } from './Dialog'

// jsdom n'implémente pas showModal/close : on les simule en pilotant
// l'attribut `open`, ce qui suffit pour tester notre logique.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.open = true
  }
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.open = false
    this.dispatchEvent(new Event('close'))
  }
})

describe('Dialog', () => {
  it("ne rend rien quand open vaut false", () => {
    render(
      <Dialog open={false} onClose={() => {}} title="Confirmer">
        Contenu
      </Dialog>,
    )
    expect(screen.queryByText('Contenu')).not.toBeInTheDocument()
  })

  it('affiche le titre et le contenu quand open vaut true', () => {
    render(
      <Dialog open onClose={() => {}} title="Confirmer">
        Contenu
      </Dialog>,
    )
    expect(screen.getByText('Confirmer')).toBeInTheDocument()
    expect(screen.getByText('Contenu')).toBeInTheDocument()
  })

  it("appelle onClose sur l'événement cancel, que le navigateur émet sur Échap", () => {
    const onClose = vi.fn()
    render(
      <Dialog open onClose={onClose} title="Confirmer">
        Contenu
      </Dialog>,
    )

    // jsdom n'implémente pas la conversion native Échap → événement `cancel`.
    // On émet donc l'événement directement : c'est exactement ce à quoi le
    // composant se branche. La chaîne complète est vérifiée à la main plus tard.
    const dialog = screen.getByRole('dialog', { hidden: true })
    dialog.dispatchEvent(new Event('cancel', { cancelable: true }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('appelle onClose au clic sur le bouton de fermeture', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(
      <Dialog open onClose={onClose} title="Confirmer">
        Contenu
      </Dialog>,
    )

    await user.click(screen.getByRole('button', { name: 'Fermer' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('relie la description au dialogue via aria-describedby', () => {
    render(
      <Dialog open onClose={() => {}} title="Confirmer" description="Action irréversible.">
        Contenu
      </Dialog>,
    )

    const dialog = screen.getByRole('dialog', { hidden: true })
    const describedBy = dialog.getAttribute('aria-describedby')
    expect(describedBy).toBeTruthy()
    expect(document.getElementById(describedBy as string)).toHaveTextContent(
      'Action irréversible.',
    )
  })

  it('affiche le pied de dialogue quand il est fourni', () => {
    render(
      <Dialog
        open
        onClose={() => {}}
        title="Confirmer"
        footer={<button type="button">Supprimer</button>}
      >
        Contenu
      </Dialog>,
    )
    expect(screen.getByRole('button', { name: 'Supprimer' })).toBeInTheDocument()
  })
})
