/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
import type { Metadata } from 'next'
import type { ServerFunctionClient } from 'payload'

import config from '@payload-config'
import { RootLayout, handleServerFunctions } from '@payloadcms/next/layouts'
import React from 'react'
import { importMap } from './admin/importMap'

/**
 * Payload's own admin stylesheet. Without this the panel renders as bare HTML —
 * blue underlined links, serif headings, no layout.
 *
 * It was previously imported only in (payload)/api/[...slug]/route.ts, which
 * has no effect on these pages: a CSS import applies to the route tree it sits
 * in, and an API route renders no document.
 *
 * Must come before custom.scss so overrides there win.
 */
import '@payloadcms/next/css'

import './custom.scss'

type Args = {
  children: React.ReactNode
}

export const metadata: Metadata = {
  title: 'ТЕХНОЛЕС Admin',
}

const serverFunction: ServerFunctionClient = async function (args) {
  'use server'
  return handleServerFunctions({
    ...args,
    config,
    importMap,
  })
}

const Layout = ({ children }: Args) => (
  <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
    {children}
  </RootLayout>
)

export default Layout
