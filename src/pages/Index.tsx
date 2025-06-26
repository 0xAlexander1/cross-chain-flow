
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Index = () => {
  const features = [
    {
      icon: '🔒',
      title: 'Sin Custodia',
      description: 'Mantén el control total de tus fondos en todo momento'
    },
    {
      icon: '⚡',
      title: 'Cross-Chain',
      description: 'Intercambia entre diferentes blockchains sin complicaciones'
    },
    {
      icon: '🛡️',
      title: 'Seguro',
      description: 'Protocolos descentralizados ThorChain y MayaProtocol'
    },
    {
      icon: '📱',
      title: 'Accesible',
      description: 'Usa con wallet conectada o de forma manual'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6">
                Intercambia cripto entre
                <span className="gradient-bg bg-clip-text text-transparent"> blockchains</span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
                Sin puentes, sin custodia. Intercambios seguros y descentralizados 
                usando ThorChain y MayaProtocol.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Link
                to="/swap"
                className="px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold text-lg hover:bg-primary/90 transition-all duration-200 hover:scale-105"
              >
                Lanzar Intercambio
              </Link>
              <Link
                to="/manual-swap"
                className="px-8 py-4 border border-border text-foreground rounded-lg font-semibold text-lg hover:bg-accent transition-all duration-200"
              >
                Modo Manual
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Decorative gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl"></div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              ¿Por qué elegir SwapDeX?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              La plataforma más segura y eficiente para intercambios cross-chain
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center p-6 rounded-2xl border border-border hover:border-primary/50 transition-all duration-300 hover-lift"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Cómo funciona
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Tecnología descentralizada que garantiza seguridad y transparencia
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="flex items-start space-x-4"
              >
                <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                  1
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    ThorChain Protocol
                  </h3>
                  <p className="text-muted-foreground">
                    Utiliza pools de liquidez descentralizados para facilitar intercambios 
                    seguros entre diferentes blockchains.
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
                className="flex items-start space-x-4"
              >
                <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                  2
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    MayaProtocol
                  </h3>
                  <p className="text-muted-foreground">
                    Protocolo complementario que amplía las capacidades de intercambio 
                    y mejora la eficiencia de las transacciones.
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
                className="flex items-start space-x-4"
              >
                <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                  3
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    SwapKit Integration
                  </h3>
                  <p className="text-muted-foreground">
                    Interfaz unificada que simplifica la interacción con múltiples 
                    protocolos y blockchains.
                  </p>
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-primary/20 to-orange-500/20 rounded-2xl p-8 border border-border backdrop-blur-sm">
                <div className="text-center">
                  <div className="text-6xl mb-4">⚡</div>
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    Intercambios Instantáneos
                  </h3>
                  <p className="text-muted-foreground">
                    Tecnología de vanguardia para intercambios rápidos y seguros
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary/10 via-background to-orange-500/10">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              ¿Listo para comenzar?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Únete a miles de usuarios que ya confían en SwapDeX para sus intercambios cross-chain
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/swap"
                className="px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold text-lg hover:bg-primary/90 transition-all duration-200 hover:scale-105"
              >
                Comenzar Ahora
              </Link>
              <Link
                to="/faq"
                className="px-8 py-4 border border-border text-foreground rounded-lg font-semibold text-lg hover:bg-accent transition-all duration-200"
              >
                Más Información
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Index;
