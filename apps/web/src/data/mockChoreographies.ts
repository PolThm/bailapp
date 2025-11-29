import type { Choreography, ChoreographyMovement } from '@/types';
import i18n from '@/i18n';

export const EXAMPLE_CHOREOGRAPHY_ID = 'example-salsa-sequence';

/**
 * Creates the example choreography "Salsa Example"
 * This choreography is shown to new users when they first visit the Choreographies page.
 * The name is translated based on the current language.
 */
export function createExampleChoreography(): Choreography {
    const movements: ChoreographyMovement[] = [
    {
        id: crypto.randomUUID(),
        name: 'Paso básico',
        order: 0,
    },
    {
        id: crypto.randomUUID(),
        name: 'Dile que no',
        order: 1,
    },
    {
        id: crypto.randomUUID(),
        name: 'Cubanito y Cubanita',
        order: 2,
        mentionId: '32023492343248490238',
        mentionType: 'figure',
    },
    {
        id: crypto.randomUUID(),
        name: 'Enchufla doble',
        order: 3,
    },
    {
        id: crypto.randomUUID(),
        name: 'Setenta',
        order: 4,
        mentionId: '3202349238490238',
        mentionType: 'figure',
    },
    {
        id: crypto.randomUUID(),
        name: 'Final feliz',
        order: 5,
    },
    ];

    return {
    id: EXAMPLE_CHOREOGRAPHY_ID,
    name: i18n.t('choreographies.example.name'),
    danceStyle: 'salsa',
    danceSubStyle: 'cuban',
    complexity: 'basic-intermediate',
    movements,
    createdAt: new Date().toISOString(),
    };
}

