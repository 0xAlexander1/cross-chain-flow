
import React from 'react';
import { motion } from 'framer-motion';

const FAQ = () => {
  const faqs = [
    {
      question: '¿Qué es un swap cross-chain?',
      answer: 'Un swap cross-chain es un intercambio de criptomonedas entre diferentes blockchains. Por ejemplo, intercambiar Bitcoin (BTC) por Ethereum (ETH) directamente, sin necesidad de un exchange centralizado.'
    },
    {
      question: '¿Es seguro usar SwapDeX?',
      answer: 'SwapDeX utiliza protocolos descentralizados como ThorChain y MayaProtocol, lo que significa que no custodiamos tus fondos. Todas las transacciones son peer-to-peer y verificables en la blockchain.'
    },
    {
      question: '¿Cuál es la diferencia entre el modo conectado y manual?',
      answer: 'El modo conectado requiere que conectes tu wallet a la web y es ideal para wallets de navegador. El modo manual es perfecto para wallets de hardware o móviles que no puedes conectar directamente.'
    },
    {
      question: '¿Qué son los memos o tags?',
      answer: 'Los memos son códigos especiales que debes incluir en tu transacción para que el protocolo sepa exactamente qué intercambio quieres realizar y a dónde enviar los tokens resultantes.'
    }
  ];

  const walletGuides = [
    {
      wallet: 'MetaMask',
      steps: [
        'Ve a la pestaña "Enviar" en MetaMask',
        'Pega la dirección de destino',
        'En "Datos hex" pega el memo proporcionado',
        'Confirma la transacción'
      ]
    },
    {
      wallet: 'Trust Wallet',
      steps: [
        'Selecciona el token a enviar',
        'Toca "Enviar"',
        'Ingresa la dirección de destino',
        'En "Memo" pega el código proporcionado',
        'Confirma el envío'
      ]
    },
    {
      wallet: 'Ledger',
      steps: [
        'Usa Ledger Live o tu app preferida',
        'Crea una nueva transacción',
        'Agrega la dirección de destino',
        'Incluye el memo en el campo "Tag" o "Memo"',
        'Confirma con tu dispositivo Ledger'
      ]
    }
  ];

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Preguntas Frecuentes
          </h1>
          <p className="text-muted-foreground">
            Todo lo que necesitas saber sobre SwapDeX
          </p>
        </motion.div>

        {/* FAQs Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Preguntas Generales
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className="bg-card border border-border rounded-xl p-6"
              >
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  {faq.question}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {faq.answer}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Wallet Guides Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Cómo añadir Memo/Tag en diferentes wallets
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {walletGuides.map((guide, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="bg-card border border-border rounded-xl p-6"
              >
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  {guide.wallet}
                </h3>
                <ol className="space-y-2">
                  {guide.steps.map((step, stepIndex) => (
                    <li key={stepIndex} className="flex items-start space-x-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-semibold">
                        {stepIndex + 1}
                      </span>
                      <span className="text-sm text-muted-foreground">{step}</span>
                    </li>
                  ))}
                </ol>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Security Warnings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Consejos de Seguridad
          </h2>
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6">
            <div className="flex items-start space-x-3">
              <div className="text-yellow-600 text-2xl">⚠️</div>
              <div>
                <h3 className="font-semibold text-yellow-600 mb-3">
                  Importante - Lee antes de usar
                </h3>
                <ul className="space-y-2 text-foreground">
                  <li className="flex items-start space-x-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Siempre verifica las direcciones antes de enviar</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-primary mt-1">•</span>
                    <span>No olvides incluir el memo/tag exacto</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Envía exactamente la cantidad especificada</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Las transacciones son irreversibles</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Prueba con cantidades pequeñas primero</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Contact Support */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center bg-card border border-border rounded-xl p-8"
        >
          <h2 className="text-2xl font-bold text-foreground mb-4">
            ¿Necesitas más ayuda?
          </h2>
          <p className="text-muted-foreground mb-6">
            Si no encontraste la respuesta que buscabas, no dudes en contactarnos
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors">
              Contactar Soporte
            </button>
            <button className="px-6 py-3 border border-border text-foreground rounded-lg font-semibold hover:bg-accent transition-colors">
              Ver Documentación
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default FAQ;
