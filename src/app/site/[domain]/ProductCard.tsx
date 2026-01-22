'use client';

import { useState } from 'react';
import Link from 'next/link';

interface ProductCardProps {
  product: any;
  index: number;
  colors: any;
  domain: string;
}

export default function ProductCard({ product, index, colors, domain }: ProductCardProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpanded(expanded === section ? null : section);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      {/* Badge Header */}
      {product.badge && (
        <div className="px-4 py-2 flex justify-between items-center" style={{ backgroundColor: colors.accent || '#1e3a5f' }}>
          <span className="text-white font-medium text-sm flex items-center gap-2">
            <span>🏆</span> {product.badge}
          </span>
          <span className="text-white text-sm">
            <span className="text-yellow-400 font-bold text-lg">{product.rating}</span>
            <span className="opacity-75"> /10 Score</span>
          </span>
        </div>
      )}
      
      <div className="p-6">
        <div className="grid md:grid-cols-2 gap-8">
          {/* 左側：圖片 + 按鈕 */}
          <div>
            <div className="bg-gray-100 rounded-lg overflow-hidden mb-4">
              {product.images?.main ? (
                <img src={product.images.main} alt={product.name} className="w-full h-auto" />
              ) : (
                <div className="w-full h-48 flex items-center justify-center text-gray-400">
                  No Image
                </div>
              )}
            </div>
            
            {product.affiliate_link && (
              <a
                href={product.affiliate_link}
                target="_blank"
                rel="noopener sponsored"
                className="block w-full text-center px-6 py-3 rounded-lg font-semibold transition hover:opacity-90"
                style={{ backgroundColor: colors.buttonBg || '#0ea5e9', color: colors.buttonText || '#fff' }}
              >
                Shop {product.name} →
              </a>
            )}
          </div>

          {/* 右側：產品資訊 */}
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h3>
            <p className="text-gray-600 mb-4">{product.tagline}</p>
            
            {/* 規格表 */}
            <div className="grid grid-cols-4 gap-4 py-4 border-t border-b border-gray-100 mb-4">
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-1">Price</div>
                <div className="flex flex-col items-center">
                  {product.price?.original > product.price?.current && (
                    <span className="text-gray-400 line-through text-xs">${product.price?.original}</span>
                  )}
                  <span className="font-bold text-cyan-500">${product.price?.current}</span>
                </div>
              </div>
              {Array.isArray(product.specs) && product.specs.slice(0, 3).map((spec: any, i: number) => (
                <div key={i} className="text-center">
                  <div className="text-xs text-gray-500 mb-1">{spec.label}</div>
                  <div className="text-sm font-medium text-gray-900">{spec.value}</div>
                </div>
              ))}
            </div>

            {/* 展開區塊 */}
            <div className="space-y-2">
              {/* Best For */}
              {Array.isArray(product.best_for) && product.best_for.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleSection('bestFor')}
                    className="w-full px-4 py-3 flex items-center justify-between bg-white hover:bg-gray-50 transition"
                  >
                    <span className="font-medium text-gray-900">🎯 Best For</span>
                    <span className="text-gray-400">{expanded === 'bestFor' ? '−' : '+'}</span>
                  </button>
                  {expanded === 'bestFor' && (
                    <div className="px-4 py-3 bg-gray-50 border-t">
                      <ul className="space-y-1">
                        {product.best_for.map((item: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-gray-600 text-sm">
                            <span className="text-green-500">✓</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Our Take (brief_review) */}
              {product.brief_review && (
                <div className="border rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleSection('ourTake')}
                    className="w-full px-4 py-3 flex items-center justify-between bg-white hover:bg-gray-50 transition"
                  >
                    <span className="font-medium text-gray-900">💬 Our Take</span>
                    <span className="text-gray-400">{expanded === 'ourTake' ? '−' : '+'}</span>
                  </button>
                  {expanded === 'ourTake' && (
                    <div className="px-4 py-3 bg-gray-50 border-t">
                      <p className="text-gray-600 text-sm">{product.brief_review}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Detailed Scores */}
              {Array.isArray(product.scores) && product.scores.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleSection('scores')}
                    className="w-full px-4 py-3 flex items-center justify-between bg-white hover:bg-gray-50 transition"
                  >
                    <span className="font-medium text-gray-900">⭐ Detailed Scores</span>
                    <span className="text-gray-400">{expanded === 'scores' ? '−' : '+'}</span>
                  </button>
                  {expanded === 'scores' && (
                    <div className="px-4 py-3 bg-gray-50 border-t">
                      <div className="space-y-2">
                        {product.scores.map((score: any, i: number) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <span className="text-gray-700">{score.label}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-yellow-400 rounded-full"
                                  style={{ width: `${(score.score / 10) * 100}%` }}
                                />
                              </div>
                              <span className="font-medium text-gray-900 w-8">{score.score}/10</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* View Full Review 連結 */}
            {product.slug && (
              <Link
                href={`/products/${product.slug}`}
                className="inline-block mt-4 text-gray-700 font-medium hover:text-gray-900 transition"
              >
                View Full Review →
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
