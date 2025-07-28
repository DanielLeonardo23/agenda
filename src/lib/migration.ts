import { getDatabase, ref, get, update } from 'firebase/database';
import { firebaseApp } from './firebase';

const db = getDatabase(firebaseApp);

// Función para migrar pagos recurrentes existentes
export async function migrateRecurringPayments() {
    try {
        console.log("Iniciando migración de pagos recurrentes...");
        
        const recurringPaymentsRef = ref(db, 'recurringPayments');
        const snapshot = await get(recurringPaymentsRef);
        
        if (!snapshot.exists()) {
            console.log("No hay pagos recurrentes para migrar");
            return { success: true, migrated: 0 };
        }
        
        const payments = snapshot.val();
        let migratedCount = 0;
        
        for (const [key, payment] of Object.entries(payments)) {
            const paymentData = payment as any;
            
            // Verificar si ya tiene los nuevos campos
            if (paymentData.daysOfWeek === undefined || paymentData.requiresApproval === undefined) {
                // Actualizar con valores por defecto
                await update(ref(db, `recurringPayments/${key}`), {
                    daysOfWeek: null, // Por defecto, no hay restricción de días de la semana
                    requiresApproval: true // Por defecto, requiere aprobación
                });
                
                migratedCount++;
                console.log(`Pago recurrente migrado: ${paymentData.name}`);
            }
        }
        
        console.log(`Migración completada. ${migratedCount} pagos recurrentes actualizados.`);
        return { success: true, migrated: migratedCount };
        
    } catch (error) {
        console.error("Error durante la migración:", error);
        return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
}

// Función para limpiar pagos pendientes antiguos
export async function cleanupOldPendingPayments() {
    try {
        console.log("Limpiando pagos pendientes antiguos...");
        
        const pendingPaymentsRef = ref(db, 'pendingAutomaticPayments');
        const snapshot = await get(pendingPaymentsRef);
        
        if (!snapshot.exists()) {
            console.log("No hay pagos pendientes para limpiar");
            return { success: true, cleaned: 0 };
        }
        
        const pendingPayments = snapshot.val();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        let cleanedCount = 0;
        
        for (const [key, payment] of Object.entries(pendingPayments)) {
            const paymentData = payment as any;
            const createdAt = new Date(paymentData.createdAt);
            
            if (createdAt < sevenDaysAgo) {
                await update(ref(db, `pendingAutomaticPayments/${key}`), {
                    status: 'rejected'
                });
                cleanedCount++;
            }
        }
        
        console.log(`Limpieza completada. ${cleanedCount} pagos pendientes marcados como rechazados.`);
        return { success: true, cleaned: cleanedCount };
        
    } catch (error) {
        console.error("Error durante la limpieza:", error);
        return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
} 