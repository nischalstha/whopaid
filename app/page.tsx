import Link from "next/link";
import {
  ArrowRight,
  Check,
  X,
  Receipt,
  Users,
  DollarSign,
  Moon,
  Sun
} from "lucide-react";

import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="container flex h-16 items-center justify-between py-4 z-10 relative">
        <div className="flex items-center gap-2 font-bold">
          <span className="text-xl">💰 WhoPaid</span>
        </div>
        <nav className="flex items-center gap-4">
          <Link href="/sign-in">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
          </Link>
          <Link href="/sign-up">
            <Button size="sm" className="bg-green-600 hover:bg-green-700">
              Get Started
            </Button>
          </Link>
        </nav>
      </header>
      <main className="flex-1 overflow-hidden">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50 dark:from-slate-950 dark:to-slate-900"></div>

          <div className="absolute top-20 right-20 w-24 h-24 bg-green-200 rounded-full opacity-20 animate-float-slow"></div>
          <div className="absolute bottom-40 left-40 w-32 h-32 bg-blue-200 rounded-full opacity-20 animate-float-medium"></div>
          <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-indigo-200 rounded-full opacity-10 animate-float-fast"></div>

          <div className="container grid lg:grid-cols-2 gap-8 py-24 md:py-32 relative z-0">
            <div className="space-y-6 flex flex-col justify-center">
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight">
                <span className="text-slate-900 dark:text-white block">
                  Who Paid?
                </span>
                <span className="text-green-600 dark:text-green-400 block mt-2 text-3xl sm:text-4xl">
                  The answer to every awkward group chat.
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-slate-700 dark:text-slate-300 max-w-xl">
                Free, unlimited expense splitting — no premium tier, no
                bullsh*t. Track everything from trips to rent. Keep your
                friendships intact.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <Link href="/sign-up">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto gap-2 bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 text-base font-medium px-8 py-6"
                  >
                    Start Splitting
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="relative w-full max-w-md">
                <div className="w-full h-[400px] relative">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-80 bg-white shadow-2xl rounded-lg rotate-[-6deg] transform transition-all animate-float-slow">
                    <div className="p-4">
                      <div className="border-b pb-2 text-center font-bold">
                        RECEIPT
                      </div>
                      <div className="pt-2 space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Pizza</span>
                          <span>$24.99</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Drinks</span>
                          <span>$18.50</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Wings</span>
                          <span>$15.99</span>
                        </div>
                      </div>
                    </div>
                    <div className="absolute bottom-4 right-4 flex items-center gap-1 text-sm text-red-600 font-medium">
                      <span>YOUR TURN</span>
                      <ArrowRight className="h-3 w-3" />
                    </div>
                  </div>

                  <div className="absolute top-6 left-1/2 -translate-x-1/2 w-64 h-80 bg-white shadow-2xl rounded-lg rotate-[4deg] transform transition-all animate-float-medium">
                    <div className="p-4">
                      <div className="border-b pb-2 text-center font-bold">
                        RECEIPT
                      </div>
                      <div className="pt-2 space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Airbnb</span>
                          <span>$230.00</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Car Rental</span>
                          <span>$85.00</span>
                        </div>
                      </div>
                    </div>
                    <div className="absolute bottom-4 left-4 flex items-center gap-1 text-sm text-blue-600 font-medium">
                      <span>ALEX PAID</span>
                    </div>
                  </div>

                  <div className="absolute top-12 left-1/2 -translate-x-1/2 w-64 h-80 bg-white shadow-lg rounded-lg transition-all animate-float-fast">
                    <div className="p-4">
                      <div className="border-b pb-2 text-center font-bold">
                        RECEIPT
                      </div>
                      <div className="pt-2 space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Groceries</span>
                          <span>$76.45</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Movie Tickets</span>
                          <span>$32.00</span>
                        </div>
                      </div>
                    </div>
                    <div className="absolute bottom-4 right-4 flex items-center gap-1 text-sm text-green-600 font-medium">
                      <span>YOU PAID</span>
                      <Check className="h-3 w-3" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-white dark:bg-slate-900">
          <div className="container">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              How It Works
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-4">
                  <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Add your group</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Invite your friends. Or enemies. We don't judge.
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mb-4">
                  <Receipt className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Log what people paid
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Add expenses as they happen. Keep it real-time.
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mb-4">
                  <DollarSign className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  We tell you who owes what
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Magic math happens. You see who needs to pay up.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-slate-50 dark:bg-slate-800">
          <div className="container">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
              Why Not Splitwise?
            </h2>
            <p className="text-center mb-12 text-lg text-slate-600 dark:text-slate-400">
              "We love Splitwise. Just kidding."
            </p>

            <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 rounded-xl shadow-lg overflow-hidden">
              <div className="grid grid-cols-3 text-center font-medium py-4 border-b">
                <div>Feature</div>
                <div className="text-green-600 dark:text-green-400">
                  WhoPaid ✅
                </div>
                <div className="text-red-600 dark:text-red-400">
                  Splitwise ❌
                </div>
              </div>

              <div className="divide-y">
                <div className="grid grid-cols-3 text-center py-4">
                  <div className="font-medium">Unlimited Splits</div>
                  <div>
                    <Check className="h-5 w-5 text-green-600 mx-auto" />
                  </div>
                  <div>
                    <X className="h-5 w-5 text-red-600 mx-auto" />
                  </div>
                </div>

                <div className="grid grid-cols-3 text-center py-4">
                  <div className="font-medium">Free Charts & Summaries</div>
                  <div>
                    <Check className="h-5 w-5 text-green-600 mx-auto" />
                  </div>
                  <div>
                    <X className="h-5 w-5 text-red-600 mx-auto" />
                  </div>
                </div>

                <div className="grid grid-cols-3 text-center py-4">
                  <div className="font-medium">No Paywall Guilt</div>
                  <div>
                    <Check className="h-5 w-5 text-green-600 mx-auto" />
                  </div>
                  <div>
                    <X className="h-5 w-5 text-red-600 mx-auto" />
                  </div>
                </div>

                <div className="grid grid-cols-3 text-center py-4">
                  <div className="font-medium">Snark Included</div>
                  <div>
                    <Check className="h-5 w-5 text-green-600 mx-auto" />
                  </div>
                  <div>
                    <X className="h-5 w-5 text-red-600 mx-auto" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-gradient-to-br from-slate-100 to-blue-50 dark:from-slate-900 dark:to-blue-950 overflow-hidden">
          <div className="container">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              See It In Action
            </h2>

            <div className="relative max-w-4xl mx-auto">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl overflow-hidden transform rotate-1 transition-all hover:rotate-0 duration-500">
                {/* Dashboard Header */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-slate-800 dark:to-slate-700 p-3 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="font-bold text-base flex items-center">
                        <span className="text-lg">💰</span>
                        <span className="ml-1">WhoPaid</span>
                        <span className="mx-2 text-slate-400">|</span>
                        <span className="text-sm bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                          Summer Trip 2025
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        $217.25 in your favor
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dashboard Content */}
                <div className="grid md:grid-cols-8 p-0">
                  {/* Expense List Section */}
                  <div className="md:col-span-5 border-r border-slate-200 dark:border-slate-700">
                    <div className="sticky top-0 z-10 bg-white dark:bg-slate-800 border-b p-3 shadow-sm flex justify-between items-center">
                      <h3 className="font-medium text-sm text-slate-500 dark:text-slate-400">
                        Today
                      </h3>
                      <button className="flex items-center gap-1 text-xs font-medium bg-green-600 text-white rounded-md px-2 py-1 hover:bg-green-700 transition-colors">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M12 5v14M5 12h14" />
                        </svg>
                        Add Expense
                      </button>
                    </div>

                    {/* Expense Items */}
                    <div className="divide-y divide-slate-100 dark:divide-slate-700">
                      {/* Expense Item 1 */}
                      <div className="relative pl-10 pr-3 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex items-start gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-200 to-orange-100 text-orange-700 border border-orange-200 flex items-center justify-center text-xs font-semibold shadow-sm flex-shrink-0">
                              AK
                            </div>
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h3 className="font-medium text-sm">
                                  Dinner at Ocean View
                                </h3>
                                <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full inline-flex items-center">
                                  4 👥
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500 mr-1"></span>
                                <span>
                                  <span className="font-medium">Alex</span> paid{" "}
                                  <span className="font-medium">$120.00</span>
                                </span>
                              </p>
                            </div>
                          </div>
                          <div className="text-right min-w-[120px] flex-shrink-0">
                            <div className="text-xs font-mono bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded inline-block">
                              6:42 PM
                            </div>
                            <div className="mt-1.5">
                              <span className="text-xs bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-1.5 py-0.5 rounded-full font-medium inline-block">
                                You owe $30.00
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Expense Item 2 */}
                      <div className="relative pl-10 pr-3 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex items-start gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-200 to-green-100 text-green-700 border border-green-200 flex items-center justify-center text-xs font-semibold shadow-sm flex-shrink-0">
                              YOU
                            </div>
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h3 className="font-medium text-sm">
                                  Hotel Reservation
                                </h3>
                                <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full inline-flex items-center">
                                  4 👥
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500 mr-1"></span>
                                <span>
                                  <span className="font-medium">You</span> paid{" "}
                                  <span className="font-medium">$350.00</span>
                                </span>
                              </p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                <span className="inline-flex items-center px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-full">
                                  Alex
                                </span>
                                <span className="inline-flex items-center px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-full">
                                  Jamie
                                </span>
                                <span className="inline-flex items-center px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-full">
                                  Taylor
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right min-w-[120px] flex-shrink-0">
                            <div className="text-xs font-mono bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded inline-block">
                              3:15 PM
                            </div>
                            <div className="mt-1.5">
                              <span className="text-xs bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded-full font-medium inline-block">
                                You get $262.50
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Expense Item 3 */}
                      <div className="relative pl-10 pr-3 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex items-start gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-200 to-purple-100 text-purple-700 border border-purple-200 flex items-center justify-center text-xs font-semibold shadow-sm flex-shrink-0">
                              JM
                            </div>
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h3 className="font-medium text-sm">
                                  Groceries
                                </h3>
                                <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full inline-flex items-center">
                                  3 👥
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500 mr-1"></span>
                                <span>
                                  <span className="font-medium">Jamie</span>{" "}
                                  paid{" "}
                                  <span className="font-medium">$45.75</span>
                                </span>
                              </p>
                            </div>
                          </div>
                          <div className="text-right min-w-[120px] flex-shrink-0">
                            <div className="text-xs font-mono bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded inline-block">
                              1:20 PM
                            </div>
                            <div className="mt-1.5">
                              <span className="text-xs bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-1.5 py-0.5 rounded-full font-medium inline-block">
                                You owe $15.25
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Balance Summary Section */}
                  <div className="md:col-span-3 p-4">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium flex items-center mb-3">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="mr-1.5 text-green-600 dark:text-green-400"
                          >
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M16 12h-6.5a2 2 0 1 0 0 4H12"></path>
                            <path d="M10 8h4a2 2 0 1 1 0 4"></path>
                          </svg>
                          Balance Summary
                        </h3>

                        {/* Summary Card */}
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-100 dark:border-green-900/50">
                          <div className="text-sm mb-1">Overall</div>
                          <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                            +$217.25
                          </div>
                          <div className="text-xs text-green-600 dark:text-green-500 mt-1">
                            in your favor
                          </div>
                        </div>

                        {/* Individual Balance Cards */}
                        <div className="mt-3 space-y-2">
                          <div className="p-2 bg-white dark:bg-slate-700 rounded-lg border border-slate-100 dark:border-slate-600 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center text-xs">
                                AK
                              </div>
                              <div className="text-sm">Alex owes you</div>
                            </div>
                            <div className="text-blue-600 dark:text-blue-400 font-medium">
                              $87.50
                            </div>
                          </div>

                          <div className="p-2 bg-white dark:bg-slate-700 rounded-lg border border-slate-100 dark:border-slate-600 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-xs">
                                JM
                              </div>
                              <div className="text-sm">Jamie owes you</div>
                            </div>
                            <div className="text-blue-600 dark:text-blue-400 font-medium">
                              $129.75
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Group Members Section */}
                      <div>
                        <h3 className="text-sm font-medium flex items-center mb-3">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="mr-1.5 text-blue-600 dark:text-blue-400"
                          >
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                          </svg>
                          Group Members
                        </h3>

                        <div className="flex flex-wrap gap-2">
                          <div className="inline-flex h-7 items-center rounded-full bg-green-100 border-green-200 text-green-800 dark:bg-green-900/30 dark:text-green-400 border px-3 text-sm">
                            <span className="font-bold mr-1">YO</span>
                            <span>(You)</span>
                          </div>

                          <div className="inline-flex h-7 items-center rounded-full bg-blue-100 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border px-3 text-sm">
                            <span className="font-bold mr-1">AK</span>
                            <span>Alex</span>
                          </div>

                          <div className="inline-flex h-7 items-center rounded-full bg-blue-100 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border px-3 text-sm">
                            <span className="font-bold mr-1">JM</span>
                            <span>Jamie</span>
                          </div>

                          <div className="inline-flex h-7 items-center rounded-full bg-blue-100 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border px-3 text-sm">
                            <span className="font-bold mr-1">TA</span>
                            <span>Taylor</span>
                          </div>
                        </div>
                      </div>

                      {/* Expense Summary */}
                      <div>
                        <h3 className="text-sm font-medium flex items-center mb-3">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="mr-1.5 text-indigo-600 dark:text-indigo-400"
                          >
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="8 12 12 16 16 12"></polyline>
                            <line x1="12" y1="8" x2="12" y2="16"></line>
                          </svg>
                          Expense Stats
                        </h3>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-2 bg-slate-50 dark:bg-slate-700 rounded-lg">
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              Total Spent
                            </div>
                            <div className="text-lg font-semibold">$515.75</div>
                          </div>

                          <div className="p-2 bg-slate-50 dark:bg-slate-700 rounded-lg">
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              Your Contribution
                            </div>
                            <div className="text-lg font-semibold">$350.00</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 bg-white dark:bg-slate-900 text-center">
          <div className="container max-w-3xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Start Splitting Now
            </h2>
            <p className="text-lg mb-10 text-slate-600 dark:text-slate-400">
              Because your friend still hasn't paid for the gas.
            </p>

            <Link href="/sign-up">
              <Button
                size="lg"
                className="gap-2 bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 text-lg font-medium px-8 py-6"
              >
                Start Splitting
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t py-8 bg-slate-50 dark:bg-slate-900 dark:border-slate-800">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-xl font-bold">💰 WhoPaid</div>

            <div className="text-center text-sm text-slate-500 dark:text-slate-400">
              Made with ✌️ by rebels who hate paywalls.
            </div>

            <div className="flex items-center gap-4">
              <a
                href="#"
                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
              >
                <span className="sr-only">GitHub</span>
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
              <a
                href="#"
                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
              >
                <span className="sr-only">Twitter</span>
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
